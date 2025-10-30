<?php
// filepath: c:\Users\Zedex\Desktop\Akshay_excel\1_Style_Caret\Chessfloor\api\signup.php
require_once "config.php";

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

$firstName = $data['firstName'] ?? '';
$lastName = $data['lastName'] ?? '';
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

if (empty($firstName) || empty($lastName) || empty($email) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Please fill all fields.']);
    exit;
}

// Hash the password for security
$hashed_password = password_hash($password, PASSWORD_DEFAULT);

// Prepare an insert statement
$sql = "INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)";

if ($stmt = $conn->prepare($sql)) {
    $stmt->bind_param("ssss", $firstName, $lastName, $email, $hashed_password);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Registration successful!']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Something went wrong. Please try again later.']);
    }
    $stmt->close();
}
$conn->close();
?>