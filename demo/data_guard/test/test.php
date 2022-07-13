<head>
	<title> Project Test </title>
</head>

<body>
	This is body

	<script>
		navigator.serviceWorker.register("sw.js");
		
    </script>


<?php
header('Set-Cookie: newcookie=thisIsNewCookie');
header('F2F: newcookie=thisIsNewCookie');

echo "sheshe<br/>";
echo $_COOKIE["newcookie"];
?>

</body>
