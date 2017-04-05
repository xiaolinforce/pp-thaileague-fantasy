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

#table_menu {
	display: inline-block;
	font-size: 30px;
}

#table_menu td {
	border: 1px solid #FFFFFF;
	width: 400px;
	cursor: pointer;
}

#table_menu td:hover {
	background-color: #ff9498;
}

</style>

</head>

<body>
	
	<div style="text-align: center; margin-top: 30px;">
		
		<table id="table_menu">
			<tr>
				<td>Setting User's Quota</td>
			</tr>
			<tr>
				<td>Setting User's Point</td>
			</tr>
			<tr>
				<td>Stadium</td>
			</tr>
			<tr>
				<td>Club</td>
			</tr>
			<tr>
				<td onclick="onclickMatch()">Match</td>
			</tr>
			<tr>
				<td>Week</td>
			</tr>
			<tr>
				<td>Season</td>
			</tr>
			<tr>
				<td>Tournament</td>
			</tr>
			<tr>
				<td>Player</td>
			</tr>
			<tr>
				<td>Coach</td>
			</tr>
			<tr>
				<td>Nation</td>
			</tr>
			<tr>
				<td onclick="onclickQuickMenu()">Quick Menu</td>
			</tr>
			<tr>
				<td onclick="onclickLogOut()">Log Out</td>
			</tr>
		</table>
		
	</div>
	
	<div id="div_loading">
		<img src="images/loading2.gif">
	</div>

</body>

<script>

$(document).ready(function(){

});

function onclickLogOut() {
	window.open("?r=Admin/Logout", "_self");
}

function onclickMatch() {
	window.open("?r=Admin/RenderMatch&iFixture=<?= $iFixtureForMatch ?>&iTournament=<?= $iTournamentForMatch ?>&iSeason=<?= $iLatestSeason ?>", "_self");
}

function onclickQuickMenu() {
	window.open("?r=Admin/RenderQuickMenu", "_self");
}

</script>

</html>

