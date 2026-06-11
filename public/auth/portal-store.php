<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function respond(int $statusCode, array $payload): void
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function normalize_deleted_ids($value): array
{
    if (!is_array($value)) {
        return [];
    }

    $ids = [];

    foreach ($value as $item) {
        if (is_string($item) && trim($item) !== '') {
            $ids[] = trim($item);
        }
    }

    return array_values(array_unique($ids));
}

function empty_store(): array
{
    return [
        'currentUser' => null,
        'clients' => [],
        'deletedClientIds' => [],
        'deletedProjectIds' => [],
        'deletedMessageIds' => [],
    ];
}

function normalize_store_payload(array $payload): ?array
{
    $candidate = isset($payload['store']) && is_array($payload['store'])
        ? $payload['store']
        : $payload;

    if (!isset($candidate['clients']) || !is_array($candidate['clients'])) {
        return null;
    }

    return apply_tombstones([
        'currentUser' => null,
        'clients' => array_values($candidate['clients']),
        'deletedClientIds' => normalize_deleted_ids($candidate['deletedClientIds'] ?? []),
        'deletedProjectIds' => normalize_deleted_ids($candidate['deletedProjectIds'] ?? []),
        'deletedMessageIds' => normalize_deleted_ids($candidate['deletedMessageIds'] ?? []),
    ]);
}

function read_store_file(string $dataFile): array
{
    if (!is_file($dataFile)) {
        return empty_store();
    }

    $raw = file_get_contents($dataFile);
    if ($raw === false || trim($raw) === '') {
        return empty_store();
    }

    $payload = json_decode($raw, true);
    if (!is_array($payload)) {
        return empty_store();
    }

    return normalize_store_payload($payload) ?? empty_store();
}

function write_store_file(string $dataFile, array $store): void
{
    $tempFile = $dataFile . '.' . bin2hex(random_bytes(6)) . '.tmp';
    $encoded = json_encode($store, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);

    if ($encoded === false || file_put_contents($tempFile, $encoded, LOCK_EX) === false) {
        @unlink($tempFile);
        respond(500, ['ok' => false, 'error' => 'write_failed']);
    }

    if (!@rename($tempFile, $dataFile)) {
        @unlink($tempFile);
        respond(500, ['ok' => false, 'error' => 'write_failed']);
    }
}

function resolve_storage_root(): string
{
    $configured = getenv('DUALSTACK_PORTAL_STORAGE_DIR');

    if (is_string($configured) && trim($configured) !== '') {
        return trim($configured);
    }

    $publicRoot = dirname(__DIR__, 2);
    $publicRootName = strtolower(basename($publicRoot));
    $sharedHostingPublicDirs = ['docs', 'public', 'public_html', 'www', 'htdocs', 'httpdocs'];

    if (in_array($publicRootName, $sharedHostingPublicDirs, true)) {
        return dirname($publicRoot) . DIRECTORY_SEPARATOR . 'portal-data';
    }

    return $publicRoot . DIRECTORY_SEPARATOR . 'portal-data';
}

function normalize_email($value): string
{
    return is_string($value) ? strtolower(trim($value)) : '';
}

function normalize_phone($value): string
{
    return is_string($value) ? preg_replace('/[^\d+]/', '', $value) : '';
}

function get_nested_string(array $value, array $path): string
{
    $cursor = $value;

    foreach ($path as $index => $key) {
        if (!is_array($cursor) || !array_key_exists($key, $cursor)) {
            return '';
        }

        if ($index === count($path) - 1) {
            return is_string($cursor[$key]) ? $cursor[$key] : '';
        }

        $cursor = $cursor[$key];
    }

    return '';
}

function timestamp_value($value): int
{
    if (!is_string($value) || trim($value) === '') {
        return 0;
    }

    $timestamp = strtotime($value);

    return $timestamp === false ? 0 : $timestamp;
}

function message_timestamp(array $message): int
{
    return max(
        timestamp_value($message['createdAt'] ?? null),
        timestamp_value($message['editedAt'] ?? null)
    );
}

function project_timestamp(array $project): int
{
    return timestamp_value($project['updatedAt'] ?? null);
}

function session_timestamp(array $session): int
{
    $timestamps = [
        timestamp_value($session['createdAt'] ?? null),
        timestamp_value($session['updatedAt'] ?? null),
    ];

    foreach (($session['projects'] ?? []) as $project) {
        if (is_array($project)) {
            $timestamps[] = project_timestamp($project);
        }
    }

    foreach (($session['messages'] ?? []) as $message) {
        if (is_array($message)) {
            $timestamps[] = message_timestamp($message);
        }
    }

    return max($timestamps);
}

function find_matching_client_index(array $clients, array $session): int
{
    $sessionId = get_nested_string($session, ['user', 'id']);
    $sessionEmail = normalize_email(get_nested_string($session, ['user', 'email']));
    $sessionPhone = normalize_phone(get_nested_string($session, ['user', 'phone']));

    foreach ($clients as $index => $client) {
        if (!is_array($client)) {
            continue;
        }

        $clientId = get_nested_string($client, ['user', 'id']);
        $clientEmail = normalize_email(get_nested_string($client, ['user', 'email']));
        $clientPhone = normalize_phone(get_nested_string($client, ['user', 'phone']));

        if (
            ($sessionId !== '' && $clientId === $sessionId) ||
            ($sessionEmail !== '' && $clientEmail === $sessionEmail) ||
            ($sessionPhone !== '' && $clientPhone === $sessionPhone)
        ) {
            return $index;
        }
    }

    return -1;
}

function merge_projects(array $existingProjects, array $incomingProjects, array $deletedProjectIds): array
{
    $projects = [];

    foreach ($existingProjects as $project) {
        if (!is_array($project)) {
            continue;
        }

        $projectId = get_nested_string($project, ['id']);
        if ($projectId !== '' && in_array($projectId, $deletedProjectIds, true)) {
            continue;
        }

        $projects[$projectId ?: 'existing-' . count($projects)] = $project;
    }

    foreach ($incomingProjects as $project) {
        if (!is_array($project)) {
            continue;
        }

        $projectId = get_nested_string($project, ['id']);
        if ($projectId !== '' && in_array($projectId, $deletedProjectIds, true)) {
            continue;
        }

        $key = $projectId ?: 'incoming-' . count($projects);
        $existing = $projects[$key] ?? null;

        if (!is_array($existing) || project_timestamp($project) >= project_timestamp($existing)) {
            $projects[$key] = $project;
        }
    }

    return array_values($projects);
}

function merge_messages(array $existingMessages, array $incomingMessages, array $deletedMessageIds): array
{
    $messages = [];

    foreach ($existingMessages as $message) {
        if (!is_array($message)) {
            continue;
        }

        $messageId = get_nested_string($message, ['id']);
        if ($messageId !== '' && in_array($messageId, $deletedMessageIds, true)) {
            continue;
        }

        $messages[$messageId ?: 'existing-' . count($messages)] = $message;
    }

    foreach ($incomingMessages as $message) {
        if (!is_array($message)) {
            continue;
        }

        $messageId = get_nested_string($message, ['id']);
        if ($messageId !== '' && in_array($messageId, $deletedMessageIds, true)) {
            continue;
        }

        $key = $messageId ?: 'incoming-' . count($messages);
        $existing = $messages[$key] ?? null;

        if (!is_array($existing) || message_timestamp($message) >= message_timestamp($existing)) {
            $messages[$key] = $message;
        }
    }

    usort($messages, static function (array $left, array $right): int {
        return message_timestamp($left) <=> message_timestamp($right);
    });

    return array_values($messages);
}

function merge_client_session(
    array $existing,
    array $incoming,
    array $deletedProjectIds,
    array $deletedMessageIds
): array {
    $existingTimestamp = session_timestamp($existing);
    $incomingTimestamp = session_timestamp($incoming);
    $base = $incomingTimestamp >= $existingTimestamp ? $incoming : $existing;

    $merged = $base;
    $merged['user'] = $base['user'] ?? ($existing['user'] ?? ($incoming['user'] ?? []));
    $merged['createdAt'] = $existing['createdAt'] ?? ($incoming['createdAt'] ?? gmdate('c'));
    $merged['updatedAt'] = $base['updatedAt'] ?? gmdate('c');
    $merged['projects'] = merge_projects(
        is_array($existing['projects'] ?? null) ? $existing['projects'] : [],
        is_array($incoming['projects'] ?? null) ? $incoming['projects'] : [],
        $deletedProjectIds
    );
    $merged['messages'] = merge_messages(
        is_array($existing['messages'] ?? null) ? $existing['messages'] : [],
        is_array($incoming['messages'] ?? null) ? $incoming['messages'] : [],
        $deletedMessageIds
    );

    if ($incomingTimestamp >= $existingTimestamp) {
        if (array_key_exists('authPassword', $incoming)) {
            $merged['authPassword'] = $incoming['authPassword'];
        }

        if (array_key_exists('leadGoal', $incoming)) {
            $merged['leadGoal'] = $incoming['leadGoal'];
        } else {
            unset($merged['leadGoal']);
        }
    }

    return $merged;
}

function apply_tombstones(array $store): array
{
    $deletedClientIds = normalize_deleted_ids($store['deletedClientIds'] ?? []);
    $deletedProjectIds = normalize_deleted_ids($store['deletedProjectIds'] ?? []);
    $deletedMessageIds = normalize_deleted_ids($store['deletedMessageIds'] ?? []);
    $clients = [];

    foreach (($store['clients'] ?? []) as $client) {
        if (!is_array($client)) {
            continue;
        }

        $clientId = get_nested_string($client, ['user', 'id']);
        if ($clientId !== '' && in_array($clientId, $deletedClientIds, true)) {
            continue;
        }

        $client['projects'] = array_values(array_filter(
            is_array($client['projects'] ?? null) ? $client['projects'] : [],
            static function ($project) use ($deletedProjectIds): bool {
                return is_array($project)
                    && !in_array(get_nested_string($project, ['id']), $deletedProjectIds, true);
            }
        ));
        $client['messages'] = array_values(array_filter(
            is_array($client['messages'] ?? null) ? $client['messages'] : [],
            static function ($message) use ($deletedMessageIds): bool {
                return is_array($message)
                    && !in_array(get_nested_string($message, ['id']), $deletedMessageIds, true);
            }
        ));

        $clients[] = $client;
    }

    return [
        'currentUser' => null,
        'clients' => array_values($clients),
        'deletedClientIds' => $deletedClientIds,
        'deletedProjectIds' => $deletedProjectIds,
        'deletedMessageIds' => $deletedMessageIds,
    ];
}

function merge_store(array $existingStore, array $incomingStore): array
{
    $deletedClientIds = normalize_deleted_ids(array_merge(
        $existingStore['deletedClientIds'] ?? [],
        $incomingStore['deletedClientIds'] ?? []
    ));
    $deletedProjectIds = normalize_deleted_ids(array_merge(
        $existingStore['deletedProjectIds'] ?? [],
        $incomingStore['deletedProjectIds'] ?? []
    ));
    $deletedMessageIds = normalize_deleted_ids(array_merge(
        $existingStore['deletedMessageIds'] ?? [],
        $incomingStore['deletedMessageIds'] ?? []
    ));

    $clients = is_array($existingStore['clients'] ?? null) ? $existingStore['clients'] : [];

    foreach (($incomingStore['clients'] ?? []) as $incomingClient) {
        if (!is_array($incomingClient)) {
            continue;
        }

        $incomingClientId = get_nested_string($incomingClient, ['user', 'id']);
        if ($incomingClientId !== '' && in_array($incomingClientId, $deletedClientIds, true)) {
            continue;
        }

        $matchingIndex = find_matching_client_index($clients, $incomingClient);

        if ($matchingIndex < 0) {
            $clients[] = $incomingClient;
            continue;
        }

        $clients[$matchingIndex] = merge_client_session(
            is_array($clients[$matchingIndex]) ? $clients[$matchingIndex] : [],
            $incomingClient,
            $deletedProjectIds,
            $deletedMessageIds
        );
    }

    return apply_tombstones([
        'currentUser' => null,
        'clients' => $clients,
        'deletedClientIds' => $deletedClientIds,
        'deletedProjectIds' => $deletedProjectIds,
        'deletedMessageIds' => $deletedMessageIds,
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    respond(204, ['ok' => true]);
}

$storageRoot = resolve_storage_root();

if (!is_dir($storageRoot) && !@mkdir($storageRoot, 0755, true)) {
    respond(500, ['ok' => false, 'error' => 'storage_unavailable']);
}

$dataFile = $storageRoot . DIRECTORY_SEPARATOR . 'portal-store.json';
$lockFile = $storageRoot . DIRECTORY_SEPARATOR . 'portal-store.lock';
$lockHandle = fopen($lockFile, 'c');

if ($lockHandle === false) {
    respond(500, ['ok' => false, 'error' => 'lock_unavailable']);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    flock($lockHandle, LOCK_SH);
    $store = read_store_file($dataFile);
    flock($lockHandle, LOCK_UN);
    fclose($lockHandle);

    respond(200, [
        'ok' => true,
        'store' => $store,
        'updatedAt' => is_file($dataFile) ? gmdate('c', filemtime($dataFile) ?: time()) : null,
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    fclose($lockHandle);
    respond(405, ['ok' => false, 'error' => 'method_not_allowed']);
}

$rawBody = file_get_contents('php://input');

if ($rawBody === false || strlen($rawBody) > 2000000) {
    fclose($lockHandle);
    respond(413, ['ok' => false, 'error' => 'payload_too_large']);
}

$payload = json_decode($rawBody ?: '{}', true);

if (!is_array($payload)) {
    fclose($lockHandle);
    respond(400, ['ok' => false, 'error' => 'invalid_json']);
}

$incomingStore = normalize_store_payload($payload);

if ($incomingStore === null) {
    fclose($lockHandle);
    respond(422, ['ok' => false, 'error' => 'invalid_store']);
}

flock($lockHandle, LOCK_EX);
$existingStore = read_store_file($dataFile);
$store = merge_store($existingStore, $incomingStore);
write_store_file($dataFile, $store);
flock($lockHandle, LOCK_UN);
fclose($lockHandle);

respond(200, [
    'ok' => true,
    'store' => $store,
    'updatedAt' => gmdate('c'),
]);
