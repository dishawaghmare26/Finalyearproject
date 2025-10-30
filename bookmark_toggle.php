<?php
// filepath: api/bookmark_toggle.php
require_once "config.php";
header('Content-Type: application/json');

// Require login
if(!isset($_SESSION["loggedin"]) || $_SESSION["loggedin"] !== true){
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

// Read JSON body
$data = json_decode(file_get_contents('php://input'), true);
$recipe_id = $data['id'] ?? null;   // recommended: short slug (e.g. "butter-chicken")
$title = $data['title'] ?? null;
$url = $data['url'] ?? null;
$image = $data['image'] ?? null;

if (empty($recipe_id) && empty($url)) {
    echo json_encode(['success' => false, 'message' => 'Missing recipe identifier.']);
    exit;
}

$user_id = $_SESSION['id'];

try {
    // Check if bookmark exists (use recipe_id as primary identifier; fallback to url)
    if (!empty($recipe_id)) {
        $sqlCheck = "SELECT id FROM bookmarks WHERE user_id = ? AND recipe_id = ?";
        $stmt = $conn->prepare($sqlCheck);
        $stmt->bind_param("is", $user_id, $recipe_id);
    } else {
        $sqlCheck = "SELECT id FROM bookmarks WHERE user_id = ? AND url = ?";
        $stmt = $conn->prepare($sqlCheck);
        $stmt->bind_param("is", $user_id, $url);
    }

    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        // Exists -> delete (unbookmark)
        $bookmarkId = $row['id'];
        $stmtDel = $conn->prepare("DELETE FROM bookmarks WHERE id = ?");
        $stmtDel->bind_param("i", $bookmarkId);
        $ok = $stmtDel->execute();
        $stmtDel->close();

        if ($ok) {
            echo json_encode(['success' => true, 'action' => 'removed']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Could not remove bookmark.']);
        }
    } else {
        // Not exists -> insert
        $sqlIns = "INSERT INTO bookmarks (user_id, recipe_id, title, url, image_url) VALUES (?, ?, ?, ?, ?)";
        $stmtIns = $conn->prepare($sqlIns);
        // Ensure recipe_id is string (could be null)
        $rid = $recipe_id ?? null;
        $t = $title ?? null;
        $u = $url ?? null;
        $img = $image ?? null;
        $stmtIns->bind_param("issss", $user_id, $rid, $t, $u, $img);
        $ok = $stmtIns->execute();
        $stmtIns->close();

        if ($ok) {
            echo json_encode(['success' => true, 'action' => 'added']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Could not add bookmark.']);
        }
    }

    $stmt->close();
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Server error.']);
}

$conn->close();
?>
