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
}

#link_admin {
	position: fixed;
	top: 0;
	left: 0;
	color: #B31F24;
}
</style>

</head>

<body>

	<a href="?r=Admin">
		<span id="link_admin">ADMIN</span>
	</a>
	
	<div id="div_login">

		<div style="text-align: center; margin-top: 50px;">
			<span class="text_login">ยูสเซอร์เนม หรือ อีเมล์</span><br>
			<input id="in_login_username" type="text" class="input_login">
		</div>
		
		<div style="text-align: center; margin-top: 20px;">
			<span class="text_login">รหัสผ่าน</span><br>
			<input id="in_login_password" type="password" class="input_login">
		</div>
		
		<div style="text-align: center; margin-top: 20px;">
			<div style="display: inline-block; width: 40%;">
				<table style="width: 100%;">
					<tr>
						<td style="width: 40px;">
							<input id="in_login_check" type="checkbox" style="width: 30px; height: 30px;">
						</td>
						<td style="color: white; padding-left: 10px; font-size: 20px; text-align: left;">จดจำการเข้าสู่ระบบ</td>
						<td style="text-align: right;">
							<button type="button" class="btn btn-danger" onclick="onclickSwitchLoginRegister(true)">สมัครสมาชิก</button>
						</td>
					</tr>
				</table>
			</div>
		</div>
		
		<div style="text-align: center; margin-top: 20px;">
			<button id="btn_login" type="button" class="btn btn-warning btn-lg" style="width: 40%;" onclick="onclickLogin()">เข้าสู่ระบบ</button>
		</div>

	</div>
	
	<div id="div_register">
	
		<div style="text-align: center; margin-top: 10px;">
			<div style="display: inline-block; width: 40%; text-align: left;">
				<button id="btn_register_back" type="button" class="btn btn-danger" onclick="onclickSwitchLoginRegister(false)">กลับหน้าเข้าสู่ระบบ</button>
			</div>
		</div>
	
		<div style="text-align: center;">
			<span class="text_login">อีเมล์</span><br>
			<input id="in_register_email" type="text" class="input_login">
		</div>
		
		<div style="text-align: center; margin-top: 20px;">
			<span class="text_login">ยูสเซอร์เนม (ใช้สำหรับโชว์ชื่อในเกม)</span><br>
			<input id="in_register_username" type="text" class="input_login">
		</div>
		
		<div style="text-align: center; margin-top: 20px;">
			<span class="text_login">รหัสผ่าน</span><br>
			<input id="in_register_password" type="password" class="input_login">
		</div>
		
		<div style="text-align: center; margin-top: 20px;">
			<span class="text_login">รหัสผ่านอีกครั้ง</span><br>
			<input id="in_register_password_repeat" type="password" class="input_login">
		</div>
		
		<div style="text-align: center; margin-top: 30px;">
			<button id="btn_register" type="button" class="btn btn-warning btn-lg" style="width: 40%;" onclick="onclickRegister()">สมัครสมาชิก</button>
		</div>
	
	</div>
	
	<div id="div_loading">
		<img src="images/loading2.gif">
	</div>

	<!-- Modal -->
	<div id="modal_warning" class="modal fade" role="dialog">
		<div class="modal-dialog">

			<!-- Modal content-->
			<div class="modal-content">
				<div class="modal-header" style="background-color: #B31F24;">
					<h4 class="modal-title" style="color: white; font-size: 25px;">Modal Header</h4>
				</div>
				<div class="modal-body">
					<p style="font-size: 18px; color: #B31F24;">Some text in the modal.</p>
				</div>
				<div class="modal-footer" style="background-color: #B31F24;">
					<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
				</div>
			</div>

		</div>
	</div>

</body>

<script>

$(document).ready(function(){

	initial();
});

function initial() {
	$('#div_login').show();
	$('#div_register').hide();
	$('#div_loading').hide();
	onEnterLoginAndRegister();
	$('#in_login_username').focus();
}

function showModal(title, content, isSmall) {
	if(isSmall)
		$('#modal_warning .modal-dialog').attr("class", "modal-dialog modal-sm");
	else
		$('#modal_warning .modal-dialog').attr("class", "modal-dialog");

	$('#modal_warning .modal-title').text(title);
	$('#modal_warning .modal-body p').html(content);
	$('#modal_warning').modal('show');
}

function onEnterLoginAndRegister() {
	$('#in_login_username, #in_login_password').keypress(function (e) {
		if (e.which == 13) {
			onclickLogin();
		    return false;
		}
	});
	
	$('#in_register_email, #in_register_username, #in_register_password, #in_register_password_repeat').keypress(function (e) {
		if (e.which == 13) {
			onclickRegister();
		    return false;
		}
	});
}

function onclickSwitchLoginRegister( toRegister ) {
	if(toRegister) {
		$('#div_login').hide();
		$('#div_register').fadeIn(500);
		$('#in_register_email').focus();
	}
	else {
		$('#div_login').fadeIn(500);
		$('#div_register').hide();
		$('#in_login_username').focus();
	}
	clearLoginForm();
	clearRegisterForm();
}

function onclickLogin() {
	$('#div_loading').show();
	$.ajax({
		url: "?r=Login/Login",
		data: {
			username: $('#in_login_username').val(),
			password: $('#in_login_password').val(),
			alwayslogin: $('#in_login_check').is(':checked') ? 1 : 0
		},
		type: 'POST',
		success: function(data){
			if( data == 0 ) {
				showModal("ไม่สามารถเข้าสู่ระบบ", "ไม่สามารถเข้าสู่ระบบได้ อาจกรอกยูสเซอร์เนมและรหัสผ่านผิด", false);
				$('#div_loading').hide();
			}
			else {
				window.open("?r=Main", "_self");
			}
		},
		error: function(){
			showModal("พบข้อผิดพลาด", "ระบบมีความผิดพลาด กรุณาลองใหม่อีกครั้ง", false);
			$('#div_loading').hide();
		},
				        
	});
}

function onclickRegister() {

	if( $('#in_register_email').val() == "" || $('#in_register_username').val() == "" || $('#in_register_password').val() == "" || $('#in_register_password_repeat').val() == "" ) {
		showModal("ลงทะเบียนไม่ได้", "โปรดกรอกให้ครบทุกช่อง", false);
		return;
	}
	
	if( !isValidEmail( $('#in_register_email').val() ) ) {
		showModal("ลงทะเบียนไม่ได้", "อีเมล์ไม่ถูกรูปแบบ", false);
		return;
	}

	if( $('#in_register_username').val().length < 6 ) {
		showModal("ลงทะเบียนไม่ได้", "ยูสเซอร์เนมต้องมีมากกว่า 6 ตัวอักษร", false);
		return;
	}

	if( $('#in_register_password').val().length < 6 ) {
		showModal("ลงทะเบียนไม่ได้", "รหัสผ่านต้องมีมากกว่า 6 ตัวอักษร", false);
		return;
	}

	if( $('#in_register_password').val() != $('#in_register_password_repeat').val() ) {
		showModal("ลงทะเบียนไม่ได้", "ยืนยันรหัสผ่านอีกครั้งไม่ถูกต้อง", false);
		return;
	}

	$('#div_loading').show();
	$.ajax({
		url: "?r=Login/Register",
		data: {
			email: $('#in_register_email').val(),
			username: $('#in_register_username').val(),
			password: $('#in_register_password').val(),
			password_repeat: $('#in_register_password_repeat').val(),
		},
		type: 'POST',
		success: function(data){

			if( data == 'full_user' ) {
				showModal("ลงทะเบียนไม่ได้", "ขณะนี้มีผู้เล่นจำนวนมากในระบบ หากต้องการสมัครจริงๆ กรุณาส่งอีเมล์มาที่ piyawach.p@hotmail.com พร้อมทั้งตั้งชื่อหัวข้อเมล์ว่า 'ต้องการเล่น PP THAILEAGUE FANTASY' เนื้อหาเมล์ให้บอก Username และ Password ที่คุณต้องการใช้ และบอกทีมในไทยลีกที่คุณชอบพร้อมเหตุผล ถ้าเรายอมรับจะส่งอีเมล์ตอบกลับไป", false);
				$('#div_loading').hide();
			}
			else if( data == 'exist_email' ) {
				showModal("ลงทะเบียนไม่ได้", "อีเมล์นี้ถูกใช้ไปแล้ว โปรดเลือกอีเมล์ใหม่", false);
				$('#div_loading').hide();
			}
			else if( data == 'exist_username' ) {
				showModal("ลงทะเบียนไม่ได้", "ยูสเซอร์เนมนี้ถูกใช้ไปแล้ว โปรดเลือกอีเมล์ใหม่", false);
				$('#div_loading').hide();
			}
			else if( data == 'success' ) {
				showModal("ลงทะเบียนสำเร็จ", "ลงทะเทียนเรียบร้อย ไปหน้าเข้าสู่ระบบเพื่อเริ่มเล่นกันได้เลย", false);
				$('#div_loading').hide();
				$('#btn_register_back').click();
			}
			else {
				showModal("ลงทะเบียนไม่ได้", "มีข้อผิดพลาด โปรดลองอีกครั้ง", false);
				$('#div_loading').hide();
			}
		},
		error: function(){
			showModal("ลงทะเบียนไม่ได้", "มีข้อผิดพลาด โปรดลองอีกครั้ง", false);
			$('#div_loading').hide();
		},	        
	});
	
}

function clearLoginForm() {
	$('#in_login_username').val('');
	$('#in_login_password').val('');
	$('#in_login_check')[0].checked = false;
}

function clearRegisterForm() {
	$('#in_register_email').val('');
	$('#in_register_username').val('');
	$('#in_register_password').val('');
	$('#in_register_password_repeat').val('');
}

function isValidEmail(str) {
	var filter=/^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i
	return (filter.test(str)); 
}


</script>

</html>



