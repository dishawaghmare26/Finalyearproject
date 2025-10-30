<?php
// filepath: api/bookmarks_list.php
require_once "config.php";
header('Content-Type: application/json');

if(!isset($_SESSION["loggedin"]) || $_SESSION["loggedin"] !== true){
    echo json_encode(['success' => false, 'message' => 'Not logged in', 'bookmarks' => []]);
    exit;
}

$user_id = $_SESSION['id'];

$sql = "SELECT id, recipe_id, title, url, image_url, created_at FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC";
if ($stmt = $conn->prepare($sql)) {
    $stmt->bind_param("i", $user_id);
    if ($stmt->execute()) {
        $result = $stmt->get_result();
        $bookmarks = [];
        while ($row = $result->fetch_assoc()) {
            $bookmarks[] = $row;
        }
        echo json_encode(['success' => true, 'bookmarks' => $bookmarks]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Could not fetch bookmarks', 'bookmarks' => []]);
    }
    $stmt->close();
} else {
    echo json_encode(['success' => false, 'message' => 'Server error', 'bookmarks' => []]);
}
$conn->close();
?>
    