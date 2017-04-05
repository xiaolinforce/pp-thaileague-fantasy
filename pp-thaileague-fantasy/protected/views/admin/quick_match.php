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

p.team_name {
	text-align: center;
	font-size: 26px;
}

#table_match_player td, #table_event_add td {
	border: 1px solid #CDCDCD;
	padding: 10px;
}

input[type="radio"] {
	width: 18px;
	height: 18px;
}

span.mp_player_name {
	font-size: 18px;
	padding-left: 20px;
}

#table_event_add select {
	width: 70%;
}

#table_event_add select {
	font-size: 16px;
}

button.approve {
	position: fixed;
	bottom: 10px;
	right: 10px;
}

</style>

</head>

<body>

<div id="div_loading">
	<img src="images/loading2.gif">
</div>

<a href="?r=Admin/RenderQuickMenu"><button type="button" class="btn btn-warning">Back</button></a>

<h2>MATCH PLAYER</h2>

<table id="table_match_player" style="width: 100%; margin-top: 20px;">
<tbody>
<tr>

<td valign="top" style="width: 50%;">
	<p class="team_name"><?= $oHomeClub->short_name_th ?></p>
	<input id="in_home_start_shirt" type="text" style="width: 100px; text-align: center;">
	<select id="sel_mp_home_start" class="sel-all-player" style="width: 50%;"></select>
	<button type="button" class="btn btn-warning" onclick="onclickAddPlayerToMatchPlayer( true, true )">ADD START</button>
	<br><br>
	<input id="in_home_sub_shirt" type="text" style="width: 100px; text-align: center;">
	<select id="sel_mp_home_sub" class="sel-all-player" style="width: 50%;"></select>
	<button type="button" class="btn btn-warning" onclick="onclickAddPlayerToMatchPlayer( true, false )">ADD SUB</button>
	<br><br>
	<h3 id="text_mp_home_start">ตัวจริง (11)</h3>
	<div id="div_mp_home_start">
		<!--  
		<div>
			<button type="button" class="btn btn-primary btn-sm captain" data-mpid="0">C</button>
			<button type="button" class="btn btn-danger btn-sm remove_mp" data-mpid="0">-</button>
			<span class="mp_player_name">1 ) ปิยวัชร์ ปราชญ์ศิลป์</span>
		</div>
		-->
		<?php 
			$iCountHomeStart = 0;
			foreach( $aMatchPlayer AS $aEachMp ) {
				if( $aEachMp['club_id'] == $oHomeClub->id && $aEachMp['start_11'] == 1 ) {
					$iCountHomeStart++;
					$sIsCaptain = $aEachMp['captain'] == 1 ? 'disabled' : '';
					$sName = $aEachMp['nation'] == 189 ? $aEachMp['name_th'] . ' ' . $aEachMp['surname_th'] : $aEachMp['called_name'];
		?>
			<div style="padding: 2px 0;">
				<button type="button" class="btn btn-primary btn-sm captain" data-mpid="<?= $aEachMp['mpid'] ?>" <?= $sIsCaptain ?>>C</button>
				<button type="button" class="btn btn-danger btn-sm remove_mp" data-mpid="<?= $aEachMp['mpid'] ?>">-</button>
				<span class="mp_player_name">[<?= $aEachMp['position'] ?>] <?= $aEachMp['shirt_no'] ?> ) <?= $sName ?></span>
			</div>
		<?php 
				}
			}
		?>
	</div>
	<h3 id="text_mp_home_sub">ตัวสำรอง (11)</h3>
	<div id="div_mp_home_sub">
		<!--  
		<div>
			<button type="button" class="btn btn-danger btn-sm remove_mp" data-mpid="0">-</button>
			<span class="mp_player_name">1 ) ปิยวัชร์ ปราชญ์ศิลป์</span>
		</div>
		-->
		<?php 
			$iCountHomeSub = 0;
			foreach( $aMatchPlayer AS $aEachMp ) {
				if( $aEachMp['club_id'] == $oHomeClub->id && $aEachMp['start_11'] == 0 ) {
					$iCountHomeSub++;
					$sName = $aEachMp['nation'] == 189 ? $aEachMp['name_th'] . ' ' . $aEachMp['surname_th'] : $aEachMp['called_name'];
		?>
			<div style="padding: 2px 0;">
				<button type="button" class="btn btn-danger btn-sm remove_mp" data-mpid="<?= $aEachMp['mpid'] ?>">-</button>
				<span class="mp_player_name">[<?= $aEachMp['position'] ?>] <?= $aEachMp['shirt_no'] ?> ) <?= $sName ?></span>
			</div>
		<?php 
				}
			}
		?>
	</div>
</td>

<td valign="top" style="width: 50%;">
	<p class="team_name"><?= $oAwayClub->short_name_th ?></p>
	<input id="in_away_start_shirt" type="text" style="width: 100px; text-align: center;">
	<select id="sel_mp_away_start" class="sel-all-player" style="width: 50%;"></select>
	<button type="button" class="btn btn-warning" onclick="onclickAddPlayerToMatchPlayer( false, true )">ADD START</button>
	<br><br>
	<input id="in_away_sub_shirt" type="text" style="width: 100px; text-align: center;">
	<select id="sel_mp_away_sub" class="sel-all-player" style="width: 50%;"></select>
	<button type="button" class="btn btn-warning" onclick="onclickAddPlayerToMatchPlayer( false, false )">ADD SUB</button>
	<br><br>
	<h3 id="text_mp_away_start">ตัวจริง (11)</h3>
	<div id="div_mp_away_start">
		<!--  
		<div>
			<button type="button" class="btn btn-primary btn-sm captain" data-mpid="0">C</button>
			<button type="button" class="btn btn-danger btn-sm remove_mp" data-mpid="0">-</button>
			<span class="mp_player_name">1 ) ปิยวัชร์ ปราชญ์ศิลป์</span>
		</div>
		-->
		<?php 
			$iCountAwayStart = 0;
			foreach( $aMatchPlayer AS $aEachMp ) {
				if( $aEachMp['club_id'] == $oAwayClub->id && $aEachMp['start_11'] == 1 ) {
					$iCountAwayStart++;
					$sIsCaptain = $aEachMp['captain'] == 1 ? 'disabled' : '';
					$sName = $aEachMp['nation'] == 189 ? $aEachMp['name_th'] . ' ' . $aEachMp['surname_th'] : $aEachMp['called_name'];
		?>
			<div style="padding: 2px 0;">
				<button type="button" class="btn btn-primary btn-sm captain" data-mpid="<?= $aEachMp['mpid'] ?>" <?= $sIsCaptain ?>>C</button>
				<button type="button" class="btn btn-danger btn-sm remove_mp" data-mpid="<?= $aEachMp['mpid'] ?>">-</button>
				<span class="mp_player_name">[<?= $aEachMp['position'] ?>] <?= $aEachMp['shirt_no'] ?> ) <?= $sName ?></span>
			</div>
		<?php 
				}
			}
		?>
	</div>
	<h3 id="text_mp_away_sub">ตัวสำรอง (11)</h3>
	<div id="div_mp_away_sub">
		<!--  
		<div>
			<button type="button" class="btn btn-danger btn-sm remove_mp" data-mpid="0">-</button>
			<span class="mp_player_name">1 ) ปิยวัชร์ ปราชญ์ศิลป์</span>
		</div>
		-->
		<?php 
			$iCountAwaySub = 0;
			foreach( $aMatchPlayer AS $aEachMp ) {
				if( $aEachMp['club_id'] == $oAwayClub->id && $aEachMp['start_11'] == 0 ) {
					$iCountAwaySub++;
					$sName = $aEachMp['nation'] == 189 ? $aEachMp['name_th'] . ' ' . $aEachMp['surname_th'] : $aEachMp['called_name'];
		?>
			<div style="padding: 2px 0;">
				<button type="button" class="btn btn-danger btn-sm remove_mp" data-mpid="<?= $aEachMp['mpid'] ?>">-</button>
				<span class="mp_player_name">[<?= $aEachMp['position'] ?>] <?= $aEachMp['shirt_no'] ?> ) <?= $sName ?></span>
			</div>
		<?php 
				}
			}
		?>
	</div>
</td>

</tr>
</tbody>
</table>

<h3 style="margin-top: 20px;">Add match player by command line</h3>
<table style="width: 70%; margin-top: 20px;">
<tbody>
<tr>
	<td style="width: 50%;">
		<textarea id="in_command_mp" rows="5" style="width: 500px;"></textarea>
	</td>
	<td style="width: 50%; padding-left: 20px;">
		<button type="button" class="btn btn-warning" onclick="onclickSaveMatchPlayerByCommandLine()">Save</button>
	</td>
</tr>
</tbody>
</table>
<p>
	format: [h/a] [start/sub] [shirts]<br>
	(one line one command)<br>
	ex: h start 1,2,3,4,5,6,7,8,9,10,11
</p>

<h2 style="margin-top: 50px;">MATCH EVENT</h2>

<?php if($bSecondYellow) { ?>
<p style="color: red;"><b>มีใบเหลืองที่สอง</b></p>
<?php } ?>

<table id="table_event_add" style="width: 100%;">
<tbody>
<tr>
	<td style="width: 15%; text-align: center;">
		<select id="sel_me_team">
			<option value="<?= $oHomeClub->id ?>"><?= $oHomeClub->short_name_th ?></option>
			<option value="<?= $oAwayClub->id ?>"><?= $oAwayClub->short_name_th ?></option>
		</select>
	</td>
	<td style="width: 22%; text-align: center;">
		<select id="sel_me_event_type">
			<?php
				foreach( $aEventType as $aEachEventType ) {
			?>
				<option value="<?= $aEachEventType['id'] ?>"><?= $aEachEventType['name_en'] ?></option>
			<?php
				}
			?>
		</select>
	</td>
	<td style="width: 40%; text-align: center;">
		<select id="sel_me_player1">
			<?php 
				foreach( $aMatchPlayer as $aEachMp ) {
					$sTeam = $aEachMp['club_id'] == $oHomeClub->id ? $oHomeClub->short_name_th : $oAwayClub->short_name_th;
					$sName = $aEachMp['nation'] == 189 ? $aEachMp['name_th'] . ' ' . $aEachMp['surname_th'] : $aEachMp['called_name'];
			?>
				<option value="<?= $aEachMp['player_id'] ?>">(<?= $sTeam ?>) [<?= $aEachMp['shirt_no'] ?>] <?= $sName ?></option>
			<?php 
				}
			?>
		</select>
		<span>เปลี่ยนเข้า, ทำประตู</span>
		<br><br>
		<select id="sel_me_player2">
			<option value="0" selected></option>
			<?php 
				foreach( $aMatchPlayer as $aEachMp ) {
					$sTeam = $aEachMp['club_id'] == $oHomeClub->id ? $oHomeClub->short_name_th : $oAwayClub->short_name_th;
					$sName = $aEachMp['nation'] == 189 ? $aEachMp['name_th'] . ' ' . $aEachMp['surname_th'] : $aEachMp['called_name'];
			?>
				<option value="<?= $aEachMp['player_id'] ?>">(<?= $sTeam ?>) [<?= $aEachMp['shirt_no'] ?>] <?= $sName ?></option>
			<?php 
				}
			?>
		</select>
		<span>เปลี่ยนออก, assist</span>
	</td>
	<td style="width: 15%; text-align: center;">
		<select id="sel_me_minute">
			<?php 
				for( $i = 0; $i < 90; $i++ ) {
			?>
				<option value="<?= $i+1 ?>"><?= $i+1 ?></option>
			<?php 
				}
			?>
		</select>
		<br><br>
		<select id="sel_me_minute_add">
			<option value="0" selected></option>
			<?php 
				for( $i = 0; $i < 20; $i++ ) {
			?>
				<option value="<?= $i+1 ?>">+ <?= $i+1 ?></option>
			<?php 
				}
			?>
		</select>
	</td>
	<td style="width: 8%; text-align: center;">
		<button type="button" class="btn btn-warning" onclick="onclickAddEvent()">Add</button>
	</td>
</tr>
</tbody>
</table>

<h3 style="margin-top: 20px;">Add match event by command line</h3>
<table style="width: 70%; margin-top: 20px;">
<tbody>
<tr>
	<td style="width: 50%;">
		<textarea id="in_command_me" rows="5" style="width: 500px;"></textarea>
	</td>
	<td style="width: 50%; padding-left: 20px;">
		<button type="button" class="btn btn-warning" onclick="onclickSaveMatchEventByCommandLine()">Save</button>
	</td>
</tr>
</tbody>
</table>
<p>
	format: [h/a] [event] [shirt1] [shirt2] [minute] [added min]<br>
	event: g, og, p(g), p(m), r, y, y2, s<br>
	(one line one command)<br>
	ex: h g 5 6 87 0
</p>

<table class="table table-bordered table-hover" style="margin-top: 20px; font-size: 18px;">
<tbody>
	<!--  
	<tr>
		<td>ราชบุรี</td>
		<td>ยิงประตู</td>
		<td>ปิยวัชร์ ปราชญ์ศิลป์ (ยิง)<br>ชนาธิป สรงกระสินทร์ (แอสซิส)</td>
		<td>45'+5</td>
		<td style="text-align: center;"><button type="button" class="btn btn-danger">-</button></td>
	</tr>
	-->
	<?php 
		foreach( $aMatchEvent as $aEachME ) {
			/* Set Player's Name */
			$sP1Name = $aEachME['p1_nation'] == 189 ? $aEachME['p1_name'] . ' ' . $aEachME['p1_surname'] : $aEachME['p1_called_name'];
			if( $aEachME['p2_name'] != null )
				$sP2Name = $aEachME['p2_nation'] == 189 ? $aEachME['p2_name'] . ' ' . $aEachME['p2_surname'] : $aEachME['p2_called_name'];
			else 
				$sP2Name = '';
			
			/* Set Player by Event */
			if( $aEachME['event_short'] == 'GOAL' ) {
				$sP1Name = $sP1Name . ' (GOAL)';
				$sP2Name = $sP2Name == '' ? '' : $sP2Name . ' (ASSIST)';
			}
			else if( $aEachME['event_short'] == 'SUB' ) {
				$sP1Name = $sP1Name . ' (IN)';
				$sP2Name = $sP2Name . ' (OUT)';
			}
			
			/* Set Minute Format */
			if( $aEachME['period'] == 1 && $aEachME['minute'] <= 45 )
				$sMinute = $aEachME['minute'] . "'";
			else if( $aEachME['period'] == 1 && $aEachME['minute'] > 45 )
				$sMinute = "45' + " . ($aEachME['minute'] - 45) . "'";
			else if( $aEachME['period'] == 2 && $aEachME['minute'] <= 90 )
				$sMinute = $aEachME['minute'] . "'";
			else if( $aEachME['period'] == 2 && $aEachME['minute'] > 90 )
				$sMinute = "90' + " . ($aEachME['minute'] - 90) . "'";
	?>
		<tr>
			<td><?= $aEachME['club_name'] ?></td>
			<td><?= $aEachME['event_name'] ?></td>
			<td><?= $sP1Name ?><br><?= $sP2Name ?></td>
			<td>
				<?php 
					$sInputValue = $aEachME['p2_shirt_no'] . "," .
							$aEachME['area_of_shoot'] . "," .
							$aEachME['shoot_by'] . "," .
							$aEachME['is_freekick'] . "," .
							$aEachME['part_of_goal_shot'];
				?>
				<img src="images/help.png" style="width: 20px;" data-toggle="tooltip" 
					title="p2_shirt | area_shoot | shoot_by(l,r,h,o) | freekick | part_goal">
				<input class="in_shoot_detail" data-meid="<?= $aEachME['id'] ?>" style="width: 100px;" value="<?= $sInputValue ?>">
				<button type="button" class="btn btn-warning save_shoot_detail" data-meid="<?= $aEachME['id'] ?>">S</button>
			</td>
			<td><?= $sMinute ?></td>
			<td style="text-align: center;">
				<button type="button" class="btn btn-danger remove_me" data-meid="<?= $aEachME['meid'] ?>">-</button>
			</td>
		</tr>
	<?php 
		}
	?>
</tbody>
</table>

<span>หากมีการเซฟจุดโทษให้ใส่ player_id ของประตูในดาตาเบสเอง และนับเป็นลูกเซฟด้วย</span>

<h2 style="margin-top: 50px;">MATCH SAVE</h2>

<?php if($bIsSubGK) { ?>
<p style="color: red;"><b>มีการเปลี่ยนตัวผู้รักษาประตู</b></p>
<?php } ?>

<table style="width: 70%; margin-top: 10px;">
<tbody>
<tr>
	<td style="width: 50%;">
		<textarea id="in_command_save" rows="5" style="width: 500px;"></textarea>
	</td>
	<td style="width: 50%; padding-left: 20px;">
		<button type="button" class="btn btn-warning" onclick="onclickSaveMatchSaveByCommandLine()">Save</button>
	</td>
</tr>
</tbody>
</table>
<p>
	format: [h/a] [shirt] [saved]<br>
	(one line one command)<br>
	ex: h 1 9;
</p>

<p style="font-size: 18px;">
	<?php 
		foreach( $aMatchSave as $aEachPlayer ) {
			$iId = $aEachPlayer['id'];
			$sName = $aEachPlayer['player_name'];
			$iSaved = $aEachPlayer['saved'];
			echo "($iId) $sName ($iSaved), ";
		}
	?>
</p>
<button type="button" class="btn btn-danger" onclick="onclickClearMatchSave()">Clear</button>

<h2 style="margin-top: 50px;">MAN OF THE MATCH</h2>
<select id="sel_man_of_the_match">
	<option value="0"></option>
	<?php 
		foreach( $aMatchPlayer as $aEachMp ) {
			$sTeam = $aEachMp['club_id'] == $oHomeClub->id ? $oHomeClub->short_name_th : $oAwayClub->short_name_th;
			$sName = $aEachMp['nation'] == 189 ? $aEachMp['name_th'] . ' ' . $aEachMp['surname_th'] : $aEachMp['called_name'];
	?>
		<option value="<?= $aEachMp['player_id'] ?>" <?= $iManOfTheMatch == $aEachMp['player_id'] ? 'selected' : '' ?>>
			(<?= $sTeam ?>) [<?= $aEachMp['shirt_no'] ?>] <?= $sName ?>
		</option>
	<?php 
		}
	?>
</select>
<button type="button" class="btn btn-warning" onclick="onclickSaveManOfTheMatch()">SAVE</button>

<h2 style="margin-top: 50px;">MATCH SCORE</h2>
<input id="in_score_home" type="text" placeHolder="HOME" value="<?= $iHomeScore != null ? $iHomeScore : '' ?>">
<input id="in_score_away" type="text" placeHolder="AWAY" value="<?= $iAwayScore != null ? $iAwayScore : '' ?>">
<button type="button" class="btn btn-warning" onclick="onclickSaveScore()">SAVE</button>

<h2 style="margin-top: 50px;">MATCH ADDED MINUTES</h2>
<input id="in_first_added_min" type="text" placeHolder="1st HALF" value="<?= $oMatch->added_min_first_half != null ? $oMatch->added_min_first_half : '' ?>">
<input id="in_second_added_min" type="text" placeHolder="2nd HALF" value="<?= $oMatch->added_min_second_half != null ? $oMatch->added_min_second_half : '' ?>">
<button type="button" class="btn btn-warning" onclick="onclickSaveAddedMin()">SAVE</button>

<h2 style="margin-top: 50px;">COACH</h2>
<select class="js-example-basic-single" id="sel_coach_home" style="width: 20%;">
	<option value="0" <?= $oMatch->home_coach_id == 0 ? 'selected' : '' ?>></option>
	<?php 
		foreach( $aCoaches as $aEachCoach ) {
			$sName = $aEachCoach['name_th'] . ' ' . $aEachCoach['surname_th'];
	?>
		<option value="<?= $aEachCoach['id'] ?>" <?= $aEachCoach['id'] == $oMatch->home_coach_id ? 'selected' : '' ?>>
			<?= $sName ?>
		</option>
	<?php 
		}
	?>
</select>
<select class="js-example-basic-single" id="sel_coach_away" style="width: 20%;">
	<option value="0" <?= $oMatch->away_coach_id == 0 ? 'selected' : '' ?>></option>
	<?php 
		foreach( $aCoaches as $aEachCoach ) {
			$sName = $aEachCoach['name_th'] . ' ' . $aEachCoach['surname_th'];
	?>
		<option value="<?= $aEachCoach['id'] ?>" <?= $aEachCoach['id'] == $oMatch->away_coach_id ? 'selected' : '' ?>>
			<?= $sName ?>
		</option>
	<?php 
		}
	?>
</select>
<button type="button" class="btn btn-warning" onclick="onclickSaveMatchCoach()">SAVE</button>

<h2 style="margin-top: 50px;">STADIUM</h2>
<span style="font-size: 18px;"><?= $sStadium ?></span>

<?php 
	if( $iApproved == 0 ) {
?>
<button type="button" class="btn btn-success btn-lg approve" onclick="onclickSetApproved(1)">Approve</button>
<?php 
	} else {
?>
<button type="button" class="btn btn-danger btn-lg approve" onclick="onclickSetApproved(0)">Not Approve</button>
<?php 
	}
?>

</body>

<script>

$(document).ready(function(){

	$(".js-example-basic-single").select2();
	$('[data-toggle="tooltip"]').tooltip(); 
	select2AllPlayers();
	onchangeSelect2PlayerToGetShirtNo();
	countTotalMpPlayer();
	onclickCaptain();
	onclickDeleteMatchPlayer();
	onclickDeleteMatchEvent();
	onclickSaveEventShootDetail();
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

function onchangeSelect2PlayerToGetShirtNo() {

	$('#sel_mp_home_start').change(function(){
		$.ajax({
			url: "?r=Admin/GetPlayerCurrentShirtNo",
			data: {
				iPlayerId: $('#sel_mp_home_start').val(),
			},
			type: 'GET',
			success: function(data){
				$('#in_home_start_shirt').val(data);
			},
			error: function(){
				alert('ERROR');
			},	        
		});
	});

	$('#sel_mp_home_sub').change(function(){
		$.ajax({
			url: "?r=Admin/GetPlayerCurrentShirtNo",
			data: {
				iPlayerId: $('#sel_mp_home_sub').val(),
			},
			type: 'GET',
			success: function(data){
				$('#in_home_sub_shirt').val(data);
			},
			error: function(){
				alert('ERROR');
			},	        
		});
	});

	$('#sel_mp_away_start').change(function(){
		$.ajax({
			url: "?r=Admin/GetPlayerCurrentShirtNo",
			data: {
				iPlayerId: $('#sel_mp_away_start').val(),
			},
			type: 'GET',
			success: function(data){
				$('#in_away_start_shirt').val(data);
			},
			error: function(){
				alert('ERROR');
			},	        
		});
	});

	$('#sel_mp_away_sub').change(function(){
		$.ajax({
			url: "?r=Admin/GetPlayerCurrentShirtNo",
			data: {
				iPlayerId: $('#sel_mp_away_sub').val(),
			},
			type: 'GET',
			success: function(data){
				$('#in_away_sub_shirt').val(data);
			},
			error: function(){
				alert('ERROR');
			},	        
		});
	});
}

function onclickAddPlayerToMatchPlayer( bIsHome, bIsStart ) {

	$('#div_loading').show();

	if( bIsHome && bIsStart ) {
		iPlayerId = $('#sel_mp_home_start').val();
		iShirtNo = $('#in_home_start_shirt').val();
		iClubId = <?= $oHomeClub->id ?>;
		iStart11 = 1;
	}
	else if( bIsHome && !bIsStart ) {
		iPlayerId = $('#sel_mp_home_sub').val();
		iShirtNo = $('#in_home_sub_shirt').val();
		iClubId = <?= $oHomeClub->id ?>;
		iStart11 = 0;
	}
	else if( !bIsHome && bIsStart ) {
		iPlayerId = $('#sel_mp_away_start').val();
		iShirtNo = $('#in_away_start_shirt').val();
		iClubId = <?= $oAwayClub->id ?>;
		iStart11 = 1;
	}
	else {
		iPlayerId = $('#sel_mp_away_sub').val();
		iShirtNo = $('#in_away_sub_shirt').val();
		iClubId = <?= $oAwayClub->id ?>;
		iStart11 = 0;
	}
	
	$.ajax({
		url: "?r=Admin/AddPlayerToMatchPlayer",
		data: {
			match_id: <?= $iMatchId ?>,
			player_id: iPlayerId,
			club_id: iClubId,
			start_11: iStart11,
			shirt_no: iShirtNo,
		},
		type: 'POST',
		success: function(data){
			if( data == 0 ) {
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

function countTotalMpPlayer() {
	$('#text_mp_home_start').text('ตัวจริง (<?= $iCountHomeStart ?>)');
	$('#text_mp_home_sub').text('ตัวสำรอง (<?= $iCountHomeSub ?>)');
	$('#text_mp_away_start').text('ตัวจริง (<?= $iCountAwayStart ?>)');
	$('#text_mp_away_sub').text('ตัวสำรอง (<?= $iCountAwaySub ?>)');
}

function onclickCaptain() {
	$('button.captain').click(function(){
		$('#div_loading').show();
		$.ajax({
			url: "?r=Admin/SetCaptainForMatchPlayer",
			data: {
				mpid: $(this).attr('data-mpid'),
			},
			type: 'POST',
			success: function(data){
				if( data == 0 ) {
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

function onclickDeleteMatchPlayer() {
	$('button.remove_mp').click(function(){
		$('#div_loading').show();
		$.ajax({
			url: "?r=Admin/DeleteMatchPlayer",
			data: {
				mpid: $(this).attr('data-mpid'),
			},
			type: 'POST',
			success: function(data){
				if( data == 0 ) {
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

function onclickAddEvent() {
	$('#div_loading').show();
	$.ajax({
		url: "?r=Admin/AddEventToMatchEvent",
		data: {
			matchId: <?= $iMatchId ?>,
			clubId: $('#sel_me_team').val(),
			playerId: $('#sel_me_player1').val(),
			secondPlayerId: $('#sel_me_player2').val(),
			eventId: $('#sel_me_event_type').val(),
			minute: $('#sel_me_minute').val(),
			addMinute: $('#sel_me_minute_add').val(),
		},
		type: 'POST',
		success: function(data){
			if( data == 0 ) {
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

function onclickDeleteMatchEvent() {
	$('button.remove_me').click(function(){
		$('#div_loading').show();
		$.ajax({
			url: "?r=Admin/DeleteMatchEvent",
			data: {
				meid: $(this).attr('data-meid'),
			},
			type: 'POST',
			success: function(data){
				if( data == 0 ) {
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

function onclickSaveManOfTheMatch() {
	$('#div_loading').show();
	$.ajax({
		url: "?r=Admin/SaveManOfTheMatch",
		data: {
			match_id: <?= $iMatchId ?>,
			player_id: $('#sel_man_of_the_match').val(),
		},
		type: 'POST',
		success: function(data){
			if( data == 0 ) {
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

function onclickSetApproved(approve) {
	$('#div_loading').show();
	$.ajax({
		url: "?r=Admin/SetApprovedMatch",
		data: {
			match_id: <?= $iMatchId ?>,
			approved: approve,
		},
		type: 'POST',
		success: function(data){
			if( data == 0 ) {
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

function onclickSaveScore() {
	$('#div_loading').show();
	$.ajax({
		url: "?r=Admin/SaveMatchScore",
		data: {
			match_id: <?= $iMatchId ?>,
			home_score: $('#in_score_home').val(),
			away_score: $('#in_score_away').val(),
		},
		type: 'POST',
		success: function(data){
			if( data == 0 ) {
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

function onclickSaveMatchPlayerByCommandLine() {
	$('#div_loading').show();
	sCommand = $('#in_command_mp').val().replace(/\n/g, ";");
	$.ajax({
		url: "?r=Admin/CommandLineSaveMatchPlayer",
		data: {
			match_id: <?= $iMatchId ?>,
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

function onclickSaveMatchEventByCommandLine() {
	$('#div_loading').show();
	sCommand = $('#in_command_me').val().replace(/\n/g, ";");
	$.ajax({
		url: "?r=Admin/CommandLineSaveMatchEvent",
		data: {
			match_id: <?= $iMatchId ?>,
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

function onclickSaveMatchSaveByCommandLine() {
	$('#div_loading').show();
	sCommand = $('#in_command_save').val().replace(/\n/g, ";");
	$.ajax({
		url: "?r=Admin/CommandLineSaveMatchSave",
		data: {
			match_id: <?= $iMatchId ?>,
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

function onclickClearMatchSave() {
	$('#div_loading').show();
	$.ajax({
		url: "?r=Admin/ClearMatchSave",
		data: {
			match_id: <?= $iMatchId ?>,
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

function onclickSaveEventShootDetail() {
	$('button.save_shoot_detail').click(function(){
		iMeId = $(this).attr('data-meid');
		$('#div_loading').show();
		$.ajax({
			url: "?r=Admin/EditMatchEventShoot",
			data: {
				text_shoot: $('input.in_shoot_detail[data-meid="'+iMeId+'"]').val(),
				me_id: iMeId
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

function onclickSaveMatchCoach() {
	$('#div_loading').show();
	$.ajax({
		url: "?r=Admin/SaveMatchCoach",
		data: {
			match_id: <?= $iMatchId ?>,
			home_coach: $('#sel_coach_home').val(),
			away_coach: $('#sel_coach_away').val(),
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

function onclickSaveAddedMin() {
	$('#div_loading').show();
	$.ajax({
		url: "?r=Admin/SaveMatchAddedMin",
		data: {
			match_id: <?= $iMatchId ?>,
			first_added_min: $('#in_first_added_min').val(),
			second_added_min: $('#in_second_added_min').val(),
		},
		type: 'POST',
		success: function(data){
			if( data == 0 ) {
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

