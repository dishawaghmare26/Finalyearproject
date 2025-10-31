<?php
require_once "config.php";

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

if (empty($email) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Please enter email and password.']);
    exit;
}

$sql = "SELECT id, email, password FROM users WHERE email = ?";

if ($stmt = $conn->prepare($sql)) {
    $stmt->bind_param("s", $email);
    
    if ($stmt->execute()) {
        $stmt->store_result();
        
        if ($stmt->num_rows == 1) {
            $stmt->bind_result($id, $email, $hashed_password);
            if ($stmt->fetch()) {
                if (password_verify($password, $hashed_password)) {
                    // Password is correct, so start a new session
                    $_SESSION["loggedin"] = true;
                    $_SESSION["id"] = $id;
                    $_SESSION["email"] = $email;                            
                    
                    echo json_encode(['success' => true, 'message' => 'Login successful!']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Invalid password.']);
                }
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'No account found with that email.']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Oops! Something went wrong.']);
    }
    $stmt->close();
}
$conn->close();

?>
