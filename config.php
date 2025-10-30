<?php
// filepath: c:\Users\Zedex\Desktop\Akshay_excel\1_Style_Caret\Chessfloor\api\config.php
// Database configuration
define('DB_SERVER', 'localhost');
define('DB_USERNAME', 'root'); // Default XAMPP username
define('DB_PASSWORD', ''); // Default XAMPP password
define('DB_NAME', 'desieats_db');

// Attempt to connect to MySQL database
$conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME);

// Check connection
if($conn === false){
    die("ERROR: Could not connect. " . $conn->connect_error);
}

// Start the session
session_start();
?>