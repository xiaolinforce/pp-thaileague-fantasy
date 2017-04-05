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

th, td {
	text-align: center;
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

<p style="font-size: 36px;"><?= $oClub->short_name_th ?></p>
<a href="?r=Admin/RenderQuickMenu"><button type="button" class="btn btn-warning">Back</button></a>

<table id="table_player" class="table table-bordered table-hover" style="width: 100%; margin-top: 20px;">
	<thead>
		<tr>
			<th></th>
			<th>id</th>
			<th>name_th</th>
			<th>surname_th</th>
			<th>called_name_th</th>
			<th>shirt</th>
			<th>position</th>
			<th>move out</th>
		</tr>
	</thead>
	<tbody>
		<?php 
			$i = 0;
			foreach( $aPlayersTeam as $aEachPlayer ) {
		?>
			<tr data-playerId="<?= $aEachPlayer['id'] ?>">
				<td><input class="check_player" type="checkbox" style="width: 25px; height: 25px;" data-index="<?= $i ?>" data-checked="0"></td>
				<td><?= $aEachPlayer['id'] ?></td>
				<td><?= $aEachPlayer['name_th'] ?></td>
				<td><?= $aEachPlayer['surname_th'] ?></td>
				<td><?= $aEachPlayer['called_name_th'] ?></td>
				<td><input class="in_shirt_no" type="text" value="<?= $aEachPlayer['current_shirt_no'] ?>" style="width: 50px;"></td>
				<td>
					<select class="sel_player_position">
						<option value="1" <?= $aEachPlayer['player_position_id'] == 1 ? 'selected' : '' ?>>ผู้รักษาประตู</option>
						<option value="2" <?= $aEachPlayer['player_position_id'] == 2 ? 'selected' : '' ?>>กองหลัง</option>
						<option value="3" <?= $aEachPlayer['player_position_id'] == 3 ? 'selected' : '' ?>>กองกลาง</option>
						<option value="4" <?= $aEachPlayer['player_position_id'] == 4 ? 'selected' : '' ?>>กองหน้า</option>
					</select>
				</td>
				<td><button type="button" class="btn btn-danger remove_player" data-playerId="<?= $aEachPlayer['id'] ?>">REMOVE</button></td>
			</tr>
		<?php 
				$i++;
			}
		?>
	</tbody>
</table>

<hr>

<h2>Add Player to Team (Exist)</h2>

<select id="sel_add_player_exist" class="js-example-basic-single">
	<?php 
		foreach( $aPlayers as $aEachPlayer ) {
	?>
		<option value="<?= $aEachPlayer['id'] ?>">
			<?= $aEachPlayer['name_th'] . ' ' . $aEachPlayer['surname_th'] . ' (' . $aEachPlayer['called_name_th'] . ')' ?>
		</option>
	<?php 
		}
	?>
</select>
<button type="button" class="btn btn-warning" onclick="onclickAddPlayerExist()">Add</button>

<hr>

<h2>Add Player to Team (New)</h2>

<div class="form-group">
	<label for="in_name_th">name_th</label>
	<input type="text" class="form-control" id="in_name_th" style="width: 50%;">
</div>
<div class="form-group">
	<label for="in_surname_th">surname_th</label>
	<input type="text" class="form-control" id="in_surname_th" style="width: 50%;">
</div>
<div class="form-group">
	<label for="in_name_en">name_en</label>
	<input type="text" class="form-control" id="in_name_en" style="width: 50%;">
</div>
<div class="form-group">
	<label for="in_surname_en">surname_en</label>
	<input type="text" class="form-control" id="in_surname_en" style="width: 50%;">
</div>
<div class="form-group">
	<label for="in_called_name">called_name_th</label>
	<input type="text" class="form-control" id="in_called_name" style="width: 50%;">
</div>
<div class="form-group">
	<label for="in_birthdate">birthdate</label>
	<input type="text" class="form-control" id="in_birthdate" style="width: 50%;" placeHolder="2017-01-22">
</div>
<div class="form-group">
	<label for="in_shirt_no">shirt_no</label>
	<input type="text" class="form-control" id="in_shirt_no" style="width: 20%;">
</div>
<div class="form-group">
	<label for="sel_addplayer_position">position</label><br>
	<select id="sel_addplayer_position">
		<option value="1">ผู้รักษาประตู</option>
		<option value="2">กองหลัง</option>
		<option value="3">กองกลาง</option>
		<option value="4">กองหน้า</option>
	</select>
</div>
<div class="form-group">
	<label for="sel_addplayer_nation">nation</label><br>
	<select id="sel_addplayer_nation" class="js-example-basic-single">
		<?php 
			foreach( $aNations as $aEachNation ) {
		?>
			<option value="<?= $aEachNation['id'] ?>"><?= $aEachNation['name_th'] ?></option>
		<?php 
			}
		?>
	</select>
</div>
<button type="button" class="btn btn-warning" onclick="onclickAddPlayerNew()">Add</button>

<hr>

<button type="button" class="btn btn-success btn-lg" style="position: fixed; bottom: 10px; right: 10px;" onclick="onclickBigSave()">SAVE</button>

</body>

<script>

$(document).ready(function(){

	$(".js-example-basic-single").select2();
	onclickCheckPlayer();
	onclickRemovePlayer();
});

function onclickCheckPlayer() {
	$('.check_player').click(function(){
		
		if( $(this).attr('data-checked') == 0 ) {
			$(this).attr('data-checked', '1');
			$('#table_player tbody tr').eq( $(this).attr('data-index') ).addClass('info');
		}
		else {
			$(this).attr('data-checked', '0');
			$('#table_player tbody tr').eq( $(this).attr('data-index') ).removeClass('info');
		}
		
	});
}

function onclickRemovePlayer() {
	$('.remove_player').click(function(){
		$.ajax({
			url: "?r=Admin/RemovePlayerFromTeam",
			data: {
				playerId: $(this).attr('data-playerId'),
			},
			type: 'POST',
			success: function(data){
				if(data == 1)
					location.reload();
				else
					alert('ERROR');
			},
			error: function(){
				alert('ERROR');
			},
					        
		});
	});
}

function onclickAddPlayerExist() {
	$.ajax({
		url: "?r=Admin/AddPlayerToTeam",
		data: {
			playerId: $('#sel_add_player_exist').val(),
			teamId: <?= $oClub->id ?>
		},
		type: 'POST',
		success: function(data){
			if(data == 1)
				location.reload();
			else
				alert('ERROR');
		},
		error: function(){
			alert('ERROR');
		},	        
	});
}

function onclickAddPlayerNew() {
	$.ajax({
		url: "?r=Admin/AddPlayerNew",
		data: {
			name_th: $('#in_name_th').val(),
			surname_th: $('#in_surname_th').val(),
			name_en: $('#in_name_en').val(),
			surname_en: $('#in_surname_en').val(),
			called_name: $('#in_called_name').val(),
			birthdate: $('#in_birthdate').val(),
			shirt_no: $('#in_shirt_no').val(),
			position: $('#sel_addplayer_position').val(),
			nation: $('#sel_addplayer_nation').val(),
			club_id: <?= $oClub->id ?>,
		},
		type: 'POST',
		success: function(data){
			if(data == 1)
				location.reload();
			else
				alert('ERROR');
		},
		error: function(){
			alert('ERROR');
		},	        
	});
}

function onclickBigSave() {
	$('#div_loading').show();
	$.ajax({
		url: "?r=Admin/SaveQuickMenuPlayer",
		data: {
			inputs: getOutputForBigSave(),
		},
		type: 'POST',
		success: function(data){
			if(data == 1)
				location.reload();
			else {
				alert('ERROR');
				$('#div_loading').hide();
			}
		},
		error: function(){
			alert('ERROR');
			$('#div_loading').hide();
		},	        
	});
}

function getOutputForBigSave() {
	sPlayerIds = "";
	for( i = 0; i < $('#table_player tbody tr').length; i++ ) {
		if( i == 0 )
			sPlayerIds = $('#table_player tbody tr').eq(i).attr('data-playerId');
		else
			sPlayerIds += (',' + $('#table_player tbody tr').eq(i).attr('data-playerId'));
	}

	sPosition = "";
	for( i = 0; i < $('#table_player .sel_player_position').length; i++ ) {
		if( i == 0 )
			sPosition = $('#table_player .sel_player_position').eq(i).val();
		else
			sPosition += (',' + $('#table_player .sel_player_position').eq(i).val());
	}

	sShirtNo = "";
	for( i = 0; i < $('#table_player .in_shirt_no').length; i++ ) {
		if( i == 0 )
			sShirtNo = $('#table_player .in_shirt_no').eq(i).val();
		else
			sShirtNo += (',' + $('#table_player .in_shirt_no').eq(i).val());
	}

	return sPlayerIds + '|' + sShirtNo + '|' + sPosition;
}

</script>

</html>

