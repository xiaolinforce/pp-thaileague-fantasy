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
	color: #B31F24;
}

#table_menu {
	width: 100%;
}

#table_menu td {
	width: 13%;
	text-align: center;
	font-size: 20px;
	padding: 20px 5px;
	background-color: #b31f24;
	color: white;
	cursor: pointer;
	border: solid 4px white;
}

#table_menu td:hover {
	background-color: #BA4D50;
}

#table_menu td.active {
	background-color: white;
	color: #b31f24;
}

#div_content {
	padding: 20px;
}

#div_loading_2 {
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

<script>

function showModal(title, content, isSmall) {
	if(isSmall)
		$('#modal_warning .modal-dialog').attr("class", "modal-dialog modal-sm");
	else
		$('#modal_warning .modal-dialog').attr("class", "modal-dialog");
	
	$('#modal_warning .modal-title').text(title);
	$('#modal_warning .modal-body p').html(content);
	$('#modal_warning').modal('show');
}

</script>

</head>

<body>
	
	<!-- Modal -->
	<div id="modal_warning" class="modal fade" role="dialog">
		<div class="modal-dialog">
	
			<!-- Modal content-->
			<div class="modal-content">
				<div class="modal-header" style="background-color: #B31F24;">
					<h4 class="modal-title" style="color: white; font-size: 25px;">Modal Header</h4>
				</div>
				<div class="modal-body">
					<p style="font-size: 18px;">Some text in the modal.</p>
				</div>
				<div class="modal-footer" style="background-color: #B31F24;">
					<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
				</div>
			</div>
	
		</div>
	</div>
	
	<p style="padding: 10px; text-align: center; background-color: #E9E9E9;">ติดต่อโฆษณา Facebook: PP Thaileague Fantasy</p>
	
	<table id="table_menu">
		<tr>
			<td class="active" data-menu="pick_team">จัด 11 ผู้เล่น</td>
			<td data-menu="point">แต้มที่ได้</td>
			<td data-menu="transfer">ซื้อ-ขาย ผู้เล่น</td>
			<td data-menu="program">โปรแกรมการแข่งขัน</td>
			<td data-menu="statistic">สถิติต่างๆ</td>
			<td data-menu="rule">กฎกติกา</td>
			<td data-menu="league">กลุ่มเพื่อน</td>
			<td data-menu="logout">ออกจากระบบ</td>
		</tr>
	</table>
	
	<div id="div_content"></div>
	
	<div id="div_loading" style="padding: 20px; text-align: center; display: none;">
		<img src="images/loading.gif">
	</div>
	
	<div id="div_loading_2">
		<img src="images/loading2.gif">
	</div>
	
</body>

<script>

var bLoadingContent = false;

$(document).ready(function(){

	topMenuClickAnimation();
	$('#table_menu td:eq(0)').click();
});

function topMenuClickAnimation() {
	
	$('#table_menu td').click(function(){

		if( !bLoadingContent ) {
		
			$('#table_menu td').removeClass("active");
			$(this).addClass("active");

			$('#div_content').empty();
			$('#div_loading').show();
			bLoadingContent = true;
			
			if( $(this).attr("data-menu") == "pick_team" )
				sUrl = "?r=Render/RenderPickTeam";
			else if( $(this).attr("data-menu") == "point" )
				sUrl = "?r=Render/RenderPoint";
			else if( $(this).attr("data-menu") == "transfer" )
				sUrl = "?r=Render/RenderTransfer";
			else if( $(this).attr("data-menu") == "program" )
				sUrl = "?r=Render/RenderProgram";
			else if( $(this).attr("data-menu") == "rule" )
				sUrl = "?r=Render/RenderRule";
			else if( $(this).attr("data-menu") == "league" )
				sUrl = "?r=Render/RenderLeague";
			else if( $(this).attr("data-menu") == "statistic" )
				sUrl = "?r=Render/RenderStat";
			else if( $(this).attr("data-menu") == "logout" ) {
				
				$.ajax({
					url: "?r=Login/Logout",
					type: "GET",
					data: {
						"to_save" : "123",
					},
					success: function(data) {
						//window.open("?r=Main", "_self");
						location.reload();
					},
					error: function() {
						alert('ERROR');
					}
				});
				return;
			}
		
			$.ajax({
				url: sUrl,
				type: "GET",
				data: {
					"to_save" : "123",
				},
				success: function(data) {
					$('#div_loading').hide();
					$('#div_content').hide();
					$('#div_content').html(data);
					$('#div_content').fadeIn(500);
					bLoadingContent = false;
				},
				error: function() {
					alert('ERROR');
					bLoadingContent = false;
				}
			});
		}
	});
	
}

</script>

</html>