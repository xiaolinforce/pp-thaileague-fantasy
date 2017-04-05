<!DOCTYPE html>
<html>

<head>

<meta charset="UTF-8">
<title>PP THAI LEAGUE FANTASY</title>

<link href="https://fonts.googleapis.com/css?family=Kanit" rel="stylesheet">

<!-- Latest compiled and minified CSS -->
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">

<!-- jQuery library -->
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js"></script>

<!-- Latest compiled JavaScript -->
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>

<!-- Select2 -->
<link href="https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.3/css/select2.min.css" rel="stylesheet" />
<script src="https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.3/js/select2.min.js"></script>

<style>
body {
	font-family: 'Kanit', sans-serif;
	color: white;
	background-color: #B31F24;
}

.input_login {
	font-size: 25px;
	width: 40%;
	text-align: center;
	margin-top: 10px;
	color: #A5A5A5;
}

.input_login:focus {
	outline: none !important;
}

.text_login {
	font-weight: bold;
	font-size: 24px;
	color: white;
}

#text_for_admin {
	position: fixed;
	bottom: 20px;
	right: 20px;
	font-size: 60px;
	color: #ff484e;
}

#div_loading {
	z-index: 100;
	position: fixed;
	top: 0;
	left: 0;
	width: 100vw;
	height: 100vh;
	background-color: black;
	opacity: 0.5;
	padding: 100px;
	text-align: center;
	display: none;
}
</style>

</head>

<body>

	<div id="div_login">

		<div style="text-align: center; margin-top: 50px;">
			<span class="text_login">ยูสเซอร์เนม หรือ อีเมล์</span><br>
			<input id="in_login_username" type="text" class="input_login">
		</div>
		
		<div style="text-align: center; margin-top: 20px;">
			<span class="text_login">รหัสผ่าน</span><br>
			<input id="in_login_password" type="password" class="input_login">
		</div>
		
		<div style="text-align: center; margin-top: 50px;">
			<button id="btn_login" type="button" class="btn btn-warning btn-lg" style="width: 40%;" onclick="onclickLogin()">เข้าสู่ระบบ</button>
		</div>

	</div>
	
	<span id="text_for_admin">FOR ADMIN</span>
	
	<div id="div_loading">
		<img src="images/loading2.gif">
	</div>

</body>

<script>

$(document).ready(function(){

});

function onclickLogin() {
	$('#div_loading').show();
	$.ajax({
		url: "?r=Admin/CheckLogin",
		data: {
			username: $('#in_login_username').val(),
			password: $('#in_login_password').val(),
		},
		type: 'POST',
		success: function(data){
			if( data == 0 ) {
				alert('ไม่สามารถเข้าสู่ระบบได้');
				$('#div_loading').hide();
			}
			else {
				window.open("?r=Admin/Menu", "_self");
			}
		},
		error: function(){
			alert('ไม่สามารถเข้าสู่ระบบได้');
			$('#div_loading').hide();
		},
				        
	});
}

</script>

</html>

