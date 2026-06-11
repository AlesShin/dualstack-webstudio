<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

function respond(int $statusCode, array $payload): void
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['ok' => false, 'error' => 'method_not_allowed']);
}

$rawBody = file_get_contents('php://input');
$payload = json_decode($rawBody ?: '{}', true);

if (!is_array($payload)) {
    respond(400, ['ok' => false, 'error' => 'invalid_json']);
}

$email = trim((string) ($payload['email'] ?? ''));
$code = preg_replace('/\D+/', '', (string) ($payload['code'] ?? ''));

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(422, ['ok' => false, 'error' => 'invalid_email']);
}

if (strlen($code) !== 6) {
    respond(422, ['ok' => false, 'error' => 'invalid_code']);
}

$clientIp = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$rateLimitKey = hash('sha256', strtolower($email) . '|' . $clientIp);
$rateLimitFile = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR)
    . DIRECTORY_SEPARATOR
    . 'dualstack-reset-mail-'
    . $rateLimitKey
    . '.json';
$cooldownSeconds = 60;

if (is_file($rateLimitFile)) {
    $stored = json_decode((string) file_get_contents($rateLimitFile), true);
    $lastSentAt = isset($stored['sent_at']) ? strtotime((string) $stored['sent_at']) : false;

    if ($lastSentAt && (time() - $lastSentAt) < $cooldownSeconds) {
        respond(429, ['ok' => false, 'error' => 'cooldown']);
    }
}

$siteHost = (string) ($_SERVER['HTTP_HOST'] ?? 'dualstack.ru');
$subject = 'Код восстановления пароля DualStack';
$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$messageLines = [
    'Здравствуйте!',
    '',
    'Вы запросили восстановление пароля в личном кабинете DualStack.',
    '',
    'Код для смены пароля: ' . $code,
    'Срок действия кода: 15 минут.',
    '',
    'Если вы не запрашивали восстановление, просто проигнорируйте это письмо.',
    '',
    'DualStack',
    'https://' . $siteHost,
];
$message = implode("\r\n", $messageLines);
$headers = implode("\r\n", [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: DualStack <info@dualstack.ru>',
    'Reply-To: info@dualstack.ru',
    'X-Mailer: PHP/' . PHP_VERSION,
]);

$sent = mail($email, $encodedSubject, $message, $headers);

if (!$sent) {
    respond(500, ['ok' => false, 'error' => 'mail_failed']);
}

@file_put_contents(
    $rateLimitFile,
    json_encode(['sent_at' => gmdate('c')], JSON_UNESCAPED_SLASHES)
);

respond(200, ['ok' => true]);
