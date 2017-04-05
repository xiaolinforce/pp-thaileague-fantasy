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
	font-size: 16px;
	padding: 20px;
}

h1 {
	background-color: #BFBFBF;
	padding: 10px;
	border-radius: 10px;
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

<div id="div_loading">
	<img src="images/loading2.gif">
</div>

<a href="?r=Admin/Menu">
	<button type="button" class="btn btn-warning">Back</button>
</a>

<h1>PLAYERS</h1>

<h3>By Team</h3>
<select id="sel_team" class="js-example-basic-single" style="width: 30%;">
	<?php 
		foreach( $aTeams as $aEachTeam ) {
	?>
		<option value="<?= $aEachTeam['id'] ?>"><?= $aEachTeam['name'] ?></option>
	<?php 
		}
	?>
</select>
<button type="button" class="btn btn-danger" onclick="onclickSearchPlayer()">Search</button>

<hr>

<h1>MATCH</h1>

<h3>Match Detail</h3>
<select id="sel_match" class="js-example-basic-single" style="width: 50%;">
	<?php 
		foreach( $aMatches as $aEachMatch ) {
	?>
		<option value="<?= $aEachMatch['match_id'] ?>">
			[<?= $aEachMatch['fixture'] ?>] <?= $aEachMatch['home_name'] ?> v <?= $aEachMatch['away_name'] ?>
			<?= $aEachMatch['approved'] == 1 ? '[A]' : '' ?>
		</option>
	<?php 
		}
	?>
</select>
<button type="button" class="btn btn-danger" onclick="onclickSearchMatch()">Search</button>

<h3>Add Match by Command Line</h3>
<textarea id="in_command_add_match" rows="5" style="width: 500px;"></textarea>
<button type="button" class="btn btn-warning" onclick="onclickAddMatchByCommandLine()">Save</button>
<p>
	format: [home] [away] [week_id] [kickoff]<br>
	team: mtu, bu, bg, buriram, chon, rat, chiang, suk, tero, suphan, korat, pat, sis, super, navy, honda, ubon, port<br>
	kickoff ex: 2017-02-28 17:45:00<br>
	(one line one command)<br>
	ex: mtu buriram 3 2017-02-28 17:45:00
</p>

<h3>Save Best Player of the Week</h3>
<input id="in_week_id_best_players" type="text" placeHolder="week_id" style="font-size: 18px; width: 100px;">
<button type="button" class="btn btn-danger" onclick="onclickGoToBestPlayers()">Go</button>

<h3>Set Current Score Table</h3>
<a href="?r=Admin/RenderQuickScoreTable"><button type="button" class="btn btn-warning">Go</button></a>

<hr>

<h1>PLAYER POINT</h1>

<h3>Calculate Player Point</h3>

<button type="button" class="btn btn-danger" onclick="onclickUpdatePlayerIdForPTP()">Update Player ID for PTP</button><br><br>
<input id="in_calculate_player_point_week" type="text" placeHolder="week to calculate">
<button type="button" class="btn btn-warning" onclick="onclickCalculatePlayerPoint()">Save</button>

<h3>Calculate Player Total Point</h3>
<input id="in_calculate_player_point_allweek" type="text" placeHolder="all weeks">
<input id="in_calculate_player_point_5week" type="text" placeHolder="latest 5 weeks">
<button type="button" class="btn btn-warning" onclick="onclickCalculatePlayerTotalPoint()">Save</button>

<h3>Update Point for User_My_Xi</h3>
<input id="in_update_myxi_by_week" type="text" placeHolder="week_id">
<button type="button" class="btn btn-warning" onclick="onclickUpdatePointUserMyXi()">Save</button>

<h3>Copy User_My_Xi to Next Week</h3>
<input id="in_copy_myxi_from_week" type="text" placeHolder="from week_id">
<input id="in_copy_myxi_to_week" type="text" placeHolder="to week_id">
<button type="button" class="btn btn-warning" onclick="onclickCopyUserMyXiToWeek()">Save</button>

<h3>Quota 2 For Next Week</h3>
<input id="in_quota2" type="text" placeHolder="last week_id">
<button type="button" class="btn btn-warning" onclick="onclickQuota2ForNextWeek()">Operate</button>

<h3>Set Reset Quota to 2</h3>
<button type="button" class="btn btn-warning" onclick="onclickResetQuotaTo2()">Operate</button>

<h3>Update USER_TOTAL_POINT</h3>
<button type="button" class="btn btn-warning" onclick="onclickUpdateUserTotalPoint()">Operate</button>

<h3>Update USER_GROUP_MEMBER</h3>
<button type="button" class="btn btn-warning" onclick="onclickUpdateUserGroupMember()">Operate</button>

<h3>Set Configs</h3>
<input id="in_config_lastest_week" type="text" placeHolder="latest_week">
<input id="in_config_week_show_point" type="text" placeHolder="week_to_show_in_point">
<input id="in_config_next_timeout" type="text" placeHolder="next_timeout">
<button type="button" class="btn btn-warning" onclick="onclickSetConfig()">Save</button>

<hr>

</body>

<script>

$(document).ready(function(){

	$(".js-example-basic-single").select2();
});

function onclickSearchPlayer() {
	window.open("?r=Admin/RenderQuickPlayer&iClubId=" + $('#sel_team').val(), "_self");
}

function onclickSearchMatch() {
	window.open("?r=Admin/RenderQuickMatch&iMatchId=" + $('#sel_match').val(), "_self");
}

function onclickAddMatchByCommandLine() {
	$('#div_loading').show();
	sCommand = $('#in_command_add_match').val().replace(/\n/g, ";");
	$.ajax({
		url: "?r=Admin/CommandLineAddMatch",
		data: {
			command: sCommand,
		},
		type: 'POST',
		success: function(data){
			if( data != 1 ) {
				alert('ERROR');
				$('#div_loading').hide();
			}
			else
				location.reload();
		},
		error: function(){
			alert('ERROR');
			$('#div_loading').hide();
		},	        
	});
}

function onclickGoToBestPlayers() {
	window.open("?r=Admin/RenderQuickBestPlayers&iWeekId=" + $('#in_week_id_best_players').val(), "_self");
}

function onclickCalculatePlayerPoint() {
	$('#div_loading').show();
	$.ajax({
		url: "?r=Admin/CalculatePlayerPoint",
		data: {
			week_id: $('#in_calculate_player_point_week').val(),
		},
		type: 'POST',
		success: function(data){
			location.reload();
		},
		error: function(){
			alert('ERROR');
			$('#div_loading').hide();
		},	        
	});
}

function onclickCalculatePlayerTotalPoint() {
	$('#div_loading').show();
	$.ajax({
		url: "?r=Admin/CalculatePlayerTotalPoint",
		data: {
			all_week_ids: $('#in_calculate_player_point_allweek').val(),
			all_lasts_week_ids: $('#in_calculate_player_point_5week').val(),
		},
		type: 'POST',
		success: function(data){
			location.reload();
		},
		error: function(){
			alert('ERROR');
			$('#div_loading').hide();
		},	        
	});
}

function onclickUpdatePlayerIdForPTP() {
	$('#div_loading').show();
	$.ajax({
		url: "?r=Admin/UpdatePlayerIdForPlayerTotalPoint",
		success: function(data){
			if( data != 1 ) {
				alert('ERROR');
				$('#div_loading').hide();
			}
			else
				location.reload();
		},
		error: function(){
			alert('ERROR');
			$('#div_loading').hide();
		},	        
	});
}

function onclickUpdatePointUserMyXi() {
	$('#div_loading').show();
	$.ajax({
		url: "?r=Admin/UpdatePointUserMyXi",
		data: {
			week_id: $('#in_update_myxi_by_week').val(),
		},
		type: 'POST',
		success: function(data){
			if( data != 1 ) {
				alert('ERROR');
				$('#div_loading').hide();
			}
			else
				location.reload();
		},
		error: function(){
			alert('ERROR');
			$('#div_loading').hide();
		},	        
	});
}

function onclickCopyUserMyXiToWeek() {
	$('#div_loading').show();
	$.ajax({
		url: "?r=Admin/CopyUserMyXiToWeek",
		data: {
			from_week_id: $('#in_copy_myxi_from_week').val(),
			to_week_id: $('#in_copy_myxi_to_week').val(),
		},
		type: 'POST',
		success: function(data){
			if( data != 1 ) {
				alert('ERROR');
				$('#div_loading').hide();
			}
			else
				location.reload();
		},
		error: function(){
			alert('ERROR');
			$('#div_loading').hide();
		},	        
	});
}

function onclickQuota2ForNextWeek() {
	$('#div_loading').show();
	$.ajax({
		url: "?r=Admin/Quota2ForNextWeek",
		data: {
			last_week_id: $('#in_quota2').val(),
		},
		type: 'POST',
		success: function(data){
			if( data != 1 ) {
				alert('ERROR');
				$('#div_loading').hide();
			}
			else
				location.reload();
		},
		error: function(){
			alert('ERROR');
			$('#div_loading').hide();
		},	        
	});
}

function onclickResetQuotaTo2() {
	$('#div_loading').show();
	$.ajax({
		url: "?r=Admin/ResetQuotaToTwo",
		type: 'POST',
		success: function(data){
			if( data != 1 ) {
				alert('ERROR');
				$('#div_loading').hide();
			}
			else
				location.reload();
		},
		error: function(){
			alert('ERROR');
			$('#div_loading').hide();
		},	        
	});
}

function onclickSetConfig() {
	
	sInput = "latest_week," + $('#in_config_lastest_week').val() + 
		"|week_to_show_in_point," + $('#in_config_week_show_point').val() + 
		"|next_timeout," + $('#in_config_next_timeout').val();
	
	$('#div_loading').show();
	$.ajax({
		url: "?r=Admin/SetConfigValue",
		type: 'POST',
		data: {
			input: sInput,
		},
		success: function(data){
			if( data != 1 ) {
				alert('ERROR');
				$('#div_loading').hide();
			}
			else
				location.reload();
		},
		error: function(){
			alert('ERROR');
			$('#div_loading').hide();
		},	        
	});
}

function onclickUpdateUserTotalPoint() {
	$('#div_loading').show();
	$.ajax({
		url: "?r=Admin/UpdateUserTotalPoint",
		type: 'POST',
		success: function(data){
			if( data != 1 ) {
				alert('ERROR');
				$('#div_loading').hide();
			}
			else
				location.reload();
		},
		error: function(){
			alert('ERROR');
			$('#div_loading').hide();
		},	        
	});
}

function onclickUpdateUserGroupMember() {
	$('#div_loading').show();
	$.ajax({
		url: "?r=Admin/UpdateUserGroupMember",
		type: 'POST',
		success: function(data){
			if( data != 1 ) {
				alert('ERROR');
				$('#div_loading').hide();
			}
			else
				location.reload();
		},
		error: function(){
			alert('ERROR');
			$('#div_loading').hide();
		},	        
	});
}

</script>

</html>

