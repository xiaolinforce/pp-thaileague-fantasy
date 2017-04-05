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
	padding: 20px;
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

div.subcontent {
	padding: 20px; 
	background-color: #FFFFFF; 
	color: #B31F24;
	border-radius: 10px;
	margin-top: 20px;
}

#table_filter_match td {
	width: 16%;
	color: black;
	font-size: 16px;
	padding: 0 10px;
}

#table_list_match {
	color: black;
	font-size: 16px;
}

#table_list_match th {
	text-align: center;
	background-color: #ececec;
}

td.completed {
	background-color: #86f586;
}

td.incomplete {
	background-color: #ff9090;
}

</style>

</head>

<body>

	<p style="font-size: 30px; position: relative">MATCH 
		<a href="?r=Admin/Menu">
			<button type="button" class="btn btn-warning" style="position: absolute; top: 0; right: 0;">กลับเมนูหลัก</button>
		</a>
	</p>
	
	<div class="subcontent">
		<p style="font-size: 24px;">กรองแมตช์</p>
		<table id="table_filter_match" style="width: 100%;">
			<tr valign="bottom">
				<td>
					<b>ทีมเหย้า</b><br>
					<select id="sel_home" style="width: 100%;">
						<option value="0" <?= !isset($_GET['iHome']) || $_GET['iHome'] == 0 ? 'selected' : '' ?>>ทุกทีม</option>
						<?php 
							foreach( $aTeams as $aEachTeam ) {
						?>
							<option value="<?= $aEachTeam['id'] ?>" <?= isset($_GET['iHome']) && $_GET['iHome'] == $aEachTeam['id'] ? 'selected' : '' ?>>
								<?= $aEachTeam['short_name_th'] ?>
							</option>
						<?php 
							}
						?>
					</select>
				</td>
				<td>
					<b>ทีมเยือน</b><br>
					<select id="sel_away" style="width: 100%;">
						<option value="0" <?= !isset($_GET['iAway']) || $_GET['iAway'] == 0 ? 'selected' : '' ?>>ทุกทีม</option>
						<?php 
							foreach( $aTeams as $aEachTeam ) {
						?>
							<option value="<?= $aEachTeam['id'] ?>" <?= isset($_GET['iAway']) && $_GET['iAway'] == $aEachTeam['id'] ? 'selected' : '' ?>>
								<?= $aEachTeam['short_name_th'] ?>
							</option>
						<?php 
							}
						?>
					</select>
				</td>
				<td>
					<b>Fixture</b><br>
					<select id="sel_fixture" style="width: 100%;">
						<option value="0" <?= !isset($_GET['iFixture']) || $_GET['iFixture'] == 0 ? 'selected' : '' ?>>ทั้งหมด</option>
						<?php 
							for( $i = 0; $i < 50; $i++ ) {
						?>
							<option value="<?= $i + 1 ?>" <?= isset($_GET['iFixture']) && $_GET['iFixture'] == ($i + 1) ? 'selected' : '' ?>>
								Fixture <?= $i + 1 ?>
							</option>
						<?php 
							}
						?>
					</select>
				</td>
				<td>
					<b>Tournament</b><br>
					<select id="sel_tournament" style="width: 100%;">
						<option value="0" <?= !isset($_GET['iTournament']) || $_GET['iTournament'] == 0 ? 'selected' : '' ?>>ทุกรายการ</option>
						<?php 
							foreach( $aTournaments as $aEachTournament ) {
						?>
							<option value="<?= $aEachTournament['id'] ?>" <?= isset($_GET['iTournament']) && $_GET['iTournament'] == $aEachTournament['id'] ? 'selected' : '' ?>>
								<?= $aEachTournament['name_th'] ?>
							</option>
						<?php 
							}
						?>
					</select>
				</td>
				<td>
					<b>ฤดูกาล</b><br>
					<select id="sel_season" style="width: 100%;">
						<option value="0" <?= !isset($_GET['iSeason']) || $_GET['iSeason'] == 0 ? 'selected' : '' ?>>ทุกฤดูกาล</option>
						<?php 
							foreach( $aSeasons as $aEachSeason ) {
						?>
							<option value="<?= $aEachSeason['id'] ?>" <?= isset($_GET['iSeason']) && $_GET['iSeason'] == $aEachSeason['id'] ? 'selected' : '' ?>>
								<?= $aEachSeason['name'] ?>
							</option>
						<?php 
							}
						?>
					</select>
				</td>
				<td><button type="button" class="btn btn-warning btn-block" onclick="onclickFilterMatch()">ค้นหา</button></td>
			</tr>
		</table>
	</div>
	
	<div class="subcontent">
		<p style="font-size: 24px;">แสดงแมตช์</p>
		
		<table id="table_list_match" class="table table-bordered table-hover" style="width: 100%;">
			<thead>
			<tr>
				<th style="width: 8%;">สถานะ</th>
				<th style="width: 21%;">ทีมเหย้า</th>
				<th style="width: 21%;">ทีมเยือน</th>
				<th style="width: 13%;">Fixture</th>
				<th style="width: 18%;">Tournament</th>
				<th style="width: 10%;">ฤดูกาล</th>
				<th style="width: 8%;"></th>
			</tr>
			</thead>
			
			<tbody>
				<?php
					foreach( $aMatches as $aEachMatch ) {
				?>
					<tr>
						<td class="<?= $aEachMatch['approved'] == 1 ? 'completed' : 'incomplete' ?>"></td>
						<td style="text-align: right;">
							<?= $aEachMatch['home_name'] ?>
							<img src="<?= $aEachMatch['home_image'] ?>" style="width: 50px; border-radius: 5px;">
						</td>
						<td>
							<img src="<?= $aEachMatch['away_image'] ?>" style="width: 50px; border-radius: 5px;">
							<?= $aEachMatch['away_name'] ?>
						</td>
						<td style="text-align: center;"><?= $aEachMatch['fixture'] ?></td>
						<td style="text-align: center;"><?= $aEachMatch['tournament'] ?></td>
						<td style="text-align: center;"><?= $aEachMatch['season'] ?></td>
						<td>
							<a href="?r=Admin/RenderMatchDetail&iMatchId=<?= $aEachMatch['match_id'] ?>">
								<button type="button" class="btn btn-info btn-block btn-sm">แก้ไข</button>
							</a>
						</td>
					</tr>
				<?php
					}
				?>
			</tbody>
		</table>
	</div>
	
	<div id="div_loading">
		<img src="images/loading2.gif">
	</div>

</body>

<script>

$(document).ready(function(){

});

function onclickFilterMatch() {
	iHome = $('#sel_home').val();
	iAway = $('#sel_away').val();
	iFixture = $('#sel_fixture').val();
	iTournament = $('#sel_tournament').val();
	iSeason = $('#sel_season').val();

	window.open("?r=Admin/RenderMatch&iFixture="+iFixture+"&iTournament="+iTournament+"&iSeason="+iSeason+"&iHome="+iHome+"&iAway="+iAway, "_self");
}

</script>

</html>

