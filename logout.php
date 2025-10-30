<?php
// filepath: c:\Users\Zedex\Desktop\Akshay_excel\1_Style_Caret\Chessfloor\api\logout.php
session_start();
$_SESSION = array();
session_destroy();
header("location: ../login.html");
exit;
?>