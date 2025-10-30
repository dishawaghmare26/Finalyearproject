<?php
// filepath: c:\Users\Zedex\Desktop\Akshay_excel\1_Style_Caret\Chessfloor\api\profile.php
require_once "config.php";

header('Content-Type: application/json');

// Check if the user is logged in, if not then redirect him to login page
if(!isset($_SESSION["loggedin"]) || $_SESSION["loggedin"] !== true){
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

$sql = "SELECT first_name, last_name, email FROM users WHERE id = ?";

if($stmt = $conn->prepare($sql)){
    $stmt->bind_param("i", $_SESSION["id"]);
    
    if($stmt->execute()){
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        echo json_encode(['success' => true, 'user' => $user]);
    } else{
        echo json_encode(['success' => false, 'message' => 'Could not fetch profile.']);
    }
    $stmt->close();
}
$conn->close();
?>