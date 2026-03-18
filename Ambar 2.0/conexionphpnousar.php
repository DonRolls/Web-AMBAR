<?php    
    $servidor = "localhost";
    $usuario = "root";
    $clave = "";
    $bd = "ambar";

    $enlace = new mysqli($servidor,$usuario,$clave,$bd);

    if ($enlace->connect_errno)
    {
        die("conexion fallida". $enlace->connect_error);
    } else{
        echo"conectado";
    }
?>