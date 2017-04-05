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

<!-- Drag and Drop Table Row -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.11.4/jquery-ui.js"></script> 
<link href="https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.11.4/jquery-ui.css" rel="stylesheet"> 

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

th {
	text-align: center;
}

</style>

</head>

<body>

<div id="div_loading">
	<img src="images/loading2.gif">
</div>

<a href="?r=Admin/RenderQuickMenu"><button type="button" class="btn btn-warning">Back</button></a>

<hr>

<div class="btn-group">
	<button type="button" class="btn btn-primary" data-toggle="tab" href="#div_current_table" onclick="setHiddenWhichTable('#table_current_table')">Current Table</button>
	<button type="button" class="btn btn-primary" data-toggle="tab" href="#div_calculate_matches" onclick="setHiddenWhichTable('#table_calculate_matches')">Calculate from Matches</button>
</div>


<div class="tab-content">

	<div id="div_current_table" class="tab-pane fade in active">
		<h2>Current Table</h2>
		<table id="table_current_table" class="table table-hover table-bordered">
			<thead>
			<tr>
				<th style="width: 5%;">#</th>
				<th>Club</th>
				<th style="width: 5%;">P</th>
				<th style="width: 5%;">W</th>
				<th style="width: 5%;">D</th>
				<th style="width: 5%;">L</th>
				<th style="width: 5%;">GF</th>
				<th style="width: 5%;">GA</th>
				<th style="width: 5%;">GD</th>
				<th style="width: 10%;">Point</th>
			</tr>
			</thead>
			<tbody>
				<?php 
					$i = 1;
					foreach( $aSavedTable as $aEachSavedTable ) {
				?>
					<tr data-clubId="<?= $aEachSavedTable['club_id'] ?>">
						<td style="text-align: center;"><?= $i ?></td>
						<td><?= $aEachSavedTable['club_name'] ?></td>
						<td style="text-align: center;"><input type="text" style="width: 40px; text-align: center;" value="<?= $aEachSavedTable['played'] ?>"></td>
						<td style="text-align: center;"><input type="text" style="width: 40px; text-align: center;" value="<?= $aEachSavedTable['win'] ?>"></td>
						<td style="text-align: center;"><input type="text" style="width: 40px; text-align: center;" value="<?= $aEachSavedTable['draw'] ?>"></td>
						<td style="text-align: center;"><input type="text" style="width: 40px; text-align: center;" value="<?= $aEachSavedTable['lose'] ?>"></td>
						<td style="text-align: center;"><input type="text" style="width: 40px; text-align: center;" value="<?= $aEachSavedTable['goal_for'] ?>"></td>
						<td style="text-align: center;"><input type="text" style="width: 40px; text-align: center;" value="<?= $aEachSavedTable['goal_against'] ?>"></td>
						<td style="text-align: center;"><input type="text" style="width: 40px; text-align: center;" value="<?= $aEachSavedTable['goal_difference'] ?>"></td>
						<td style="text-align: center;"><input type="text" style="width: 40px; text-align: center;" value="<?= $aEachSavedTable['point'] ?>"></td>
					</tr>
				<?php 
						$i++;
					}
				?>
			</tbody>
		</table>
	</div>
	
	<div id="div_calculate_matches" class="tab-pane fade">
		<h2>Calculate from Matches</h2>
		<table id="table_calculate_matches" class="table table-hover table-bordered">
			<thead>
			<tr>
				<th style="width: 5%;">#</th>
				<th>Club</th>
				<th style="width: 5%;">P</th>
				<th style="width: 5%;">W</th>
				<th style="width: 5%;">D</th>
				<th style="width: 5%;">L</th>
				<th style="width: 5%;">GF</th>
				<th style="width: 5%;">GA</th>
				<th style="width: 5%;">GD</th>
				<th style="width: 10%;">Point</th>
			</tr>
			</thead>
			<tbody>
				<?php 
					$i = 1;
					foreach( $aCalculatedTable as $aEachCTable ) {
				?>
					<tr data-clubId="<?= $aEachCTable['club_id'] ?>">
						<td style="text-align: center;"><?= $i ?></td>
						<td><?= $aEachCTable['club_name'] ?></td>
						<td style="text-align: center;"><input type="text" style="width: 40px; text-align: center;" value="<?= $aEachCTable['P'] ?>"></td>
						<td style="text-align: center;"><input type="text" style="width: 40px; text-align: center;" value="<?= $aEachCTable['W'] ?>"></td>
						<td style="text-align: center;"><input type="text" style="width: 40px; text-align: center;" value="<?= $aEachCTable['D'] ?>"></td>
						<td style="text-align: center;"><input type="text" style="width: 40px; text-align: center;" value="<?= $aEachCTable['L'] ?>"></td>
						<td style="text-align: center;"><input type="text" style="width: 40px; text-align: center;" value="<?= $aEachCTable['GF'] ?>"></td>
						<td style="text-align: center;"><input type="text" style="width: 40px; text-align: center;" value="<?= $aEachCTable['GA'] ?>"></td>
						<td style="text-align: center;"><input type="text" style="width: 40px; text-align: center;" value="<?= $aEachCTable['GD'] ?>"></td>
						<td style="text-align: center;"><input type="text" style="width: 40px; text-align: center;" value="<?= $aEachCTable['point'] ?>"></td>
					</tr>
				<?php 
						$i++;
					}
				?>
			</tbody>
		</table>
	</div>
	
</div>

<button type="button" class="btn btn-warning" onclick="onclickReorder()">Reorder</button>
<button type="button" class="btn btn-success" onclick="onclickSave()">Save</button>

<br><br>
<span>อย่าลืม Reorder ก่อน Save</span>

<input id="hid_which_table" type="hidden" value="#table_current_table">

</body>

<script>

$(document).ready(function(){

	$(".js-example-basic-single").select2();
	$('tbody').sortable();
});

function onclickReorder() {
	for( i = 0; i < $('#table_current_table tbody tr').length; i++ ) {
		$('#table_current_table tbody tr:eq('+i+') td:eq(0)').text( i + 1 );
	}
	for( i = 0; i < $('#table_calculate_matches tbody tr').length; i++ ) {
		$('#table_calculate_matches tbody tr:eq('+i+') td:eq(0)').text( i + 1 );
	}
}

function setHiddenWhichTable(id) {
	$('#hid_which_table').val(id);
}

function onclickSave() {
	$('#div_loading').show();
	$.ajax({
		url: "?r=Admin/SaveScoreTable",
		data: {
			input: getTableInput(),
		},
		type: 'POST',
		success: function(data){
			location.reload();
		},
		error: function(){
			$('#div_loading').hide();
			alert('ERROR');
		},		        
	});
}

function getTableInput() {
	sCurrentTableId = $('#hid_which_table').val();
	sReturn = "";
	for( i = 0; i < $(sCurrentTableId + ' tbody tr').length; i++ ) {
		sRowId = sCurrentTableId + ' tbody tr:eq('+i+')';
		iPlace = $(sRowId + ' td:eq(0)').text();
		iClubId = $(sCurrentTableId + ' tbody tr:eq('+i+')').attr('data-clubId');
		iP = $(sRowId + ' td:eq(2) input').val();
		iW = $(sRowId + ' td:eq(3) input').val();
		iD = $(sRowId + ' td:eq(4) input').val();
		iL = $(sRowId + ' td:eq(5) input').val();
		iGF = $(sRowId + ' td:eq(6) input').val();
		iGA = $(sRowId + ' td:eq(7) input').val();
		iGD = $(sRowId + ' td:eq(8) input').val();
		iPoint = $(sRowId + ' td:eq(9) input').val();

		if( sReturn == "" ) {
			sReturn = iPlace + ',' + iClubId + ',' + iP + ',' + iW + ',' + iD + ',' + iL + ',' +
				iGF + ',' + iGA + ',' + iGD + ',' + iPoint;
		}
		else {
			sReturn += '|' + iPlace + ',' + iClubId + ',' + iP + ',' + iW + ',' + iD + ',' + iL + ',' +
				iGF + ',' + iGA + ',' + iGD + ',' + iPoint;
		}
	}

	return sReturn;
}

</script>

</html>

