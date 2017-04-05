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
	font-size: 14px;
	padding: 40px;
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

#table_list_player td {
	padding: 5px;
	font-size: 20px;
	text-align: center;
}

</style>

</head>

<body>

<div id="div_loading">
	<img src="images/loading2.gif">
</div>

<a href="?r=Admin/RenderQuickMenu"><button type="button" class="btn btn-warning">Back</button></a>

<br><br>

<p><b>Player</b></p>
<select id="sel_player" class="sel-all-player" style="width: 50%;"></select>
<br><br>
<p><b>Club</b></p>
<select id="sel_club" style="width: 50%;">
	<?php
		foreach( $aTeams as $aEachTeam ) {
	?>
		<option value="<?= $aEachTeam['id'] ?>"><?= $aEachTeam['name'] ?></option>
	<?php
		}
	?>
</select>
<br><br>
<button type="button" class="btn btn-danger" onclick="onclickAddPlayer()">Add</button>

<table id="table_list_player" class="table table-bordered table-hover" style="margin-top: 20px;">
<tbody>
	<?php 
		foreach( $aBestPlayers as $aEachPlayer ) {
			$sName = $aEachPlayer['nation'] == 189 ? $aEachPlayer['name'] . ' ' . $aEachPlayer['surname'] : $aEachPlayer['called_name'];
	?>
		<tr>
			<td><?= $sName ?></td>
			<td style="width: 30%;"><?= $aEachPlayer['club'] ?></td>
			<td style="width: 100px;">
				<button type="button" class="btn btn-danger remove-player" data-id="<?= $aEachPlayer['id'] ?>">-</button>
			</td>
		</tr>
	<?php 
		}
	?>
</tbody>
</table>

</body>

<script>

$(document).ready(function(){

	$(".js-example-basic-single").select2();
	select2AllPlayers();
	onclickRemovePlayer();
});

function select2AllPlayers() {
	$(".sel-all-player").select2({
		ajax: {
			url: "?r=Admin/Select2Player",
		    dataType: 'json',
		    delay: 250,
		    data: function (params) {
				return {
					q: params.term, // search term
					page: params.page
				};
		    },
		    processResults: function (data, params) {
			    
				params.page = params.page || 1;

				return {
			        results: data,
			        pagination: {
						more: (params.page * 30) < data.total_count
					}
				};
		    },
		    cache: true
		},
		escapeMarkup: function (markup) { return markup; }, // let our custom formatter work
	});
}

function onclickRemovePlayer() {
	$('button.remove-player').click(function(){
		$('#div_loading').show();
		$.ajax({
			url: "?r=Admin/RemovePlayerBest",
			data: {
				id: $(this).attr('data-id'),
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
	});
}

function onclickAddPlayer() {
	$('#div_loading').show();
	$.ajax({
		url: "?r=Admin/AddBestPlayer",
		data: {
			week_id: <?= $iWeekId ?>,
			player_id: $('#sel_player').val(),
			club_id: $('#sel_club').val(),
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

</script>

</html>

