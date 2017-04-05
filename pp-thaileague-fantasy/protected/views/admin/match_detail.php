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
	color: black;
	background-color: #B31F24;
	padding: 20px;
}

.table-bordered>tbody>tr>td, 
.table-bordered>tbody>tr>th, 
.table-bordered>tfoot>tr>td, 
.table-bordered>tfoot>tr>th, 
.table-bordered>thead>tr>td, 
.table-bordered>thead>tr>th {
	border: 1px solid #b31f24;
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

.text_head {
	color: black;
	font-size: 20px;
	text-align: center;
	background-color: #CFCFCF;
	border-radius: 10px;
}

input.captain {
	width: 20px;
	height: 20px;
}

div.player {
	padding: 2px 5px; 
	position: relative;
}

div.player:hover {
	background-color: #ffdadb;
}

img.remove_player {
	position: absolute; 
	top: 5px; 
	right: 5px; 
	width: 20px;
	cursor: pointer;
}

span.player_count {
	position: absolute; 
	top: 0; 
	right: 10px; 
	font-size: 20px; 
	color: #FFFFFF;
}

#table_event_save th {
	text-align: center;
}

img.event {
	width: 30px;
}

td.event {
	width: 35px;
	text-align: center;
	cursor: pointer;
}

#table_event_list td {
	border: 1px solid #ffe7e7;
	padding: 10px;
}

</style>

</head>

<body>

	<button type="button" class="btn btn-success btn-lg" style="position: fixed; bottom: 10px; right: 10px;">บันทึก</button>

	<p style="font-size: 30px; position: relative; color: white;">MATCH : <?= $oClubHome->short_name_th ?> v <?= $oClubAway->short_name_th ?>
		<a href="?r=Admin/RenderMatch&iFixture=<?= $iFixtureForMatch ?>&iTournament=<?= $iTournamentForMatch ?>&iSeason=<?= $iLatestSeason ?>">
			<button type="button" class="btn btn-warning" style="position: absolute; top: 0; right: 0;">กลับหน้า MATCH</button>
		</a>
	</p>
	
	<div class="subcontent">
		<p style="font-size: 24px;">รายชื่อผู้เล่น</p>
		
		<table style="width: 100%; color: black;" class="table table-bordered">
		<tbody>
		
			<tr>
				<td style="text-align: right; font-size: 24px; width: 50%; color: #B31F24;">
					<?= $oClubHome->short_name_th ?> <img src="<?= Helpers::getThumbnailSrc('images/' . $oClubHome->image_rectangle, 100) ?>" style="width: 100px; border-radius: 5px;">
				</td>
				<td style="font-size: 24px; width: 50%; color: #B31F24;">
					<img src="<?= Helpers::getThumbnailSrc('images/' . $oClubAway->image_rectangle, 100) ?>" style="width: 100px; border-radius: 5px;"> <?= $oClubAway->short_name_th ?>
				</td>
			</tr>
			
			<tr>
				<td>
					<p class="text_head" style="position: relative;">
						ตัวจริง
						<img src="images/help.png" style="position: absolute; top: 4px; left: 10px; width: 20px;" data-toggle="tooltip" 
							title="แสดงรายชื่อผู้เล่นตัวจริงทีมเหย้า คลิกในวงกลมด้านหน้าผู้เล่นสำหรับผู้เล่นที่เป็นกัปตัน คลิกปุ่มลบด้านหลังผู้เล่นเพื่อลบผู้เล่น หากมีดอกจันทน์ที่ผู้เล่น หมายความว่าผู้เล่นนั้นไม่ได้อยู่ในทีม ควรไปแก้ไขให้ผู้เล่นนั้นอยู่ในทีมที่ถูกต้องในเมนู Player">
						<span id="text_count_home_start" class="player_count">0</span>
					</p>
					<hr style="margin-top: 10px;">
					<div style="text-align: center; margin-top: 20px;">
						<img src="images/help.png" style="width: 20px; margin-right: 10px;" data-toggle="tooltip" title="เพิ่มผู้เล่นตัวจริงทีมเหย้า โดยเพิ่มได้จากเบอร์เสื้อหรือจากชื่อผู้เล่นอย่างใดอย่างหนึ่ง">
						<input type="number" style="width: 70px; text-align: center; font-size: 16px;">
						<select id="sel_home_start" class="js-example-placeholder-single player" style="width: 70%; color: black;">
							<option value="" selected="selected">Please Select</option>
						</select>
						<button id="btn_add_home_start" type="button" class="btn btn-success">เพิ่ม</button>
					</div>
					<hr>
					<div id="div_home_start11" style="margin-top: 20px;">
						<div class="player" data-playerId="10">
							<input type="radio" name="captain_home" class="captain">
							<input type="number" style="width: 70px; text-align: center; font-size: 16px;">
							<span style="font-size: 16px; padding-left: 5px;">ศิลา ศรีกำปัง</span>
							<img src="images/remove.png" class="remove_player" data-playerId="10">
							<img src="images/asterisk.png" style="position: absolute; top: 5px; right: 40px; width: 20px;">
						</div>
						<div class="player" data-playerId="11">
							<input type="radio" name="captain_home" class="captain">
							<input type="number" style="width: 70px; text-align: center; font-size: 16px;">
							<span style="font-size: 16px; padding-left: 5px;">ศิลา ศรีกำปัง</span>
							<img src="images/remove.png" class="remove_player" data-playerId="11">
						</div>
						<div class="player" data-playerId="12">
							<input type="radio" name="captain_home" class="captain">
							<input type="number" style="width: 70px; text-align: center; font-size: 16px;">
							<span style="font-size: 16px; padding-left: 5px;">ศิลา ศรีกำปัง</span>
							<img src="images/remove.png" class="remove_player" data-playerId="12">
						</div>
					</div>
					
					<hr style="margin-top: 50px; margin-bottom: 10px;">
					
					<p class="text_head" style="position: relative;">
						ตัวสำรอง
						<img src="images/help.png" style="position: absolute; top: 4px; left: 10px; width: 20px;" data-toggle="tooltip" 
							title="แสดงรายชื่อผู้เล่นตัวสำรองทีมเหย้า คลิกปุ่มลบด้านหลังผู้เล่นเพื่อลบผู้เล่น หากมีดอกจันทน์ที่ผู้เล่น หมายความว่าผู้เล่นนั้นไม่ได้อยู่ในทีม ควรไปแก้ไขให้ผู้เล่นนั้นอยู่ในทีมที่ถูกต้องในเมนู Player">
						<span id="text_count_home_sub" class="player_count">0</span>
					</p>
					<hr style="margin-top: 10px;">
					<div style="text-align: center; margin-top: 20px;">
						<img src="images/help.png" style="width: 20px; margin-right: 10px;" data-toggle="tooltip" title="เพิ่มผู้เล่นตัวสำรองทีมเหย้า โดยเพิ่มได้จากเบอร์เสื้อหรือจากชื่อผู้เล่นอย่างใดอย่างหนึ่ง">
						<input type="number" style="width: 70px; text-align: center; font-size: 16px;">
						<select id="sel_home_sub" class="js-example-placeholder-single player" style="width: 70%; color: black;">
							<option value="" selected="selected">Please Select</option>
						</select>
						<button type="button" class="btn btn-success">เพิ่ม</button>
					</div>
					<hr>
					<div id="div_home_sub" style="margin-top: 20px;">
						<div class="player" data-playerId="10">
							<input type="number" style="width: 70px; text-align: center; font-size: 16px;">
							<span style="font-size: 16px; padding-left: 5px;">ศิลา ศรีกำปัง</span>
							<img src="images/remove.png" class="remove_player" data-playerId="10">
							<img src="images/asterisk.png" style="position: absolute; top: 5px; right: 40px; width: 20px;">
						</div>
					</div>
					<hr>
				</td>
				<td>
					<p class="text_head" style="position: relative;">
						ตัวจริง
						<img src="images/help.png" style="position: absolute; top: 4px; left: 10px; width: 20px;" data-toggle="tooltip" 
							title="แสดงรายชื่อผู้เล่นตัวจริงทีมเยือน คลิกในวงกลมด้านหน้าผู้เล่นสำหรับผู้เล่นที่เป็นกัปตัน คลิกปุ่มลบด้านหลังผู้เล่นเพื่อลบผู้เล่น หากมีดอกจันทน์ที่ผู้เล่น หมายความว่าผู้เล่นนั้นไม่ได้อยู่ในทีม ควรไปแก้ไขให้ผู้เล่นนั้นอยู่ในทีมที่ถูกต้องในเมนู Player">
						<span id="text_count_away_start" class="player_count">0</span>
					</p>
					<hr style="margin-top: 10px;">
					<div style="text-align: center; margin-top: 20px;">
						<img src="images/help.png" style="width: 20px; margin-right: 10px;" data-toggle="tooltip" title="เพิ่มผู้เล่นตัวจริงทีมเยือน โดยเพิ่มได้จากเบอร์เสื้อหรือจากชื่อผู้เล่นอย่างใดอย่างหนึ่ง">
						<input type="number" style="width: 70px; text-align: center; font-size: 16px;">
						<select id="sel_away_start" class="js-example-placeholder-single player" style="width: 70%; color: black;">
							<option value="" selected="selected">Please Select</option>
						</select>
						<button type="button" class="btn btn-success">เพิ่ม</button>
					</div>
					<hr>
					<div id="div_away_start11">
						<p style="color: #D9D9D9; margin-top: 20px; text-align: center; font-size: 20px;">ยังไม่ได้เพิ่มผู้เล่น</p>
					</div>
					
					<hr style="margin-top: 50px; margin-bottom: 10px;">
					
					<p class="text_head" style="position: relative;">
						ตัวสำรอง
						<img src="images/help.png" style="position: absolute; top: 4px; left: 10px; width: 20px;" data-toggle="tooltip" 
							title="แสดงรายชื่อผู้เล่นตัวสำรองทีมเยือน คลิกปุ่มลบด้านหลังผู้เล่นเพื่อลบผู้เล่น หากมีดอกจันทน์ที่ผู้เล่น หมายความว่าผู้เล่นนั้นไม่ได้อยู่ในทีม ควรไปแก้ไขให้ผู้เล่นนั้นอยู่ในทีมที่ถูกต้องในเมนู Player">
						<span id="text_count_away_sub" class="player_count">0</span>
					</p>
					<hr style="margin-top: 10px;">
					<div style="text-align: center; margin-top: 20px;">
						<img src="images/help.png" style="width: 20px; margin-right: 10px;" data-toggle="tooltip" title="เพิ่มผู้เล่นตัวสำรองทีมเยือน โดยเพิ่มได้จากเบอร์เสื้อหรือจากชื่อผู้เล่นอย่างใดอย่างหนึ่ง">
						<input type="number" style="width: 70px; text-align: center; font-size: 16px;">
						<select id="sel_away_sub" class="js-example-placeholder-single player" style="width: 70%; color: black;">
							<option value="" selected="selected">Please Select</option>
						</select>
						<button type="button" class="btn btn-success">เพิ่ม</button>
					</div>
					<hr>
					<div id="div_away_sub">
						<p style="color: #D9D9D9; margin-top: 20px; text-align: center; font-size: 20px;">ยังไม่ได้เพิ่มผู้เล่น</p>
					</div>
					<hr>
				</td>
			</tr>
		
		</tbody>
		</table>
		
		<p style="font-size: 24px;">เหตุการณ์</p>
		
		<table id="table_event_save" style="width: 100%; color: black;" class="table table-bordered">
		<tbody>
			<tr>
				<th colspan="2">เลือกทีม</th>
				<th colspan="8">เลือกเหตุการณ์</th>
				<th>เลือกผู้เล่น</th>
				<th style="width: 15%;">เลือกเวลา (นาทีที่)</th>
				<th style="width: 7%;"></th>
			</tr>
			<tr>
				<td style="width: 10%; text-align: center; cursor: pointer;">
					<?= $oClubHome->short_name_th ?><br>
					<img src="<?= Helpers::getThumbnailSrc('images/' . $oClubHome->image_rectangle, 70) ?>" style="width: 70px; border-radius: 5px;">
				</td>
				<td style="width: 10%; text-align: center; cursor: pointer;">
					<?= $oClubAway->short_name_th ?><br>
					<img src="<?= Helpers::getThumbnailSrc('images/' . $oClubAway->image_rectangle, 70) ?>" style="width: 70px; border-radius: 5px;">
				</td>
				
				<td class="event"><img src="images/icon_event/goal.png" class="event" data-toggle="tooltip" title="ทำประตู"></td>
				<td class="event"><img src="images/icon_event/own_goal.png" class="event" data-toggle="tooltip" title="ทำเข้าประตูตัวเอง"></td>
				<td class="event"><img src="images/icon_event/penalty_goal.png" class="event" data-toggle="tooltip" title="ยิงจุดโทษเข้า"></td>
				<td class="event"><img src="images/icon_event/penalty_miss.png" class="event" data-toggle="tooltip" title="ยิงจุดโทษพลาด"></td>
				<td class="event"><img src="images/icon_event/yellow_card.png" class="event" data-toggle="tooltip" title="ใบเหลือง"></td>
				<td class="event"><img src="images/icon_event/second_yellow_card.png" class="event" data-toggle="tooltip" title="ใบเหลืองที่สอง"></td>
				<td class="event"><img src="images/icon_event/red_card.png" class="event" data-toggle="tooltip" title="ใบแดง"></td>
				<td class="event"><img src="images/icon_event/sub.png" class="event" data-toggle="tooltip" title="เปลี่ยนตัว"></td>
				
				<td>
					<div style="padding: 3px 0;">
						<span style="display: inline-block; width: 30%; text-align: right;">ผู้ทำประตู</span>
						<select style="width: 65%;"></select>
					</div>
					<div style="padding: 3px 0;">
						<span style="display: inline-block; width: 30%; text-align: right;">Assist</span>
						<select style="width: 65%;"></select>
					</div>
				</td>
				<td style="text-align: center;">
					<select style="width: 90%; margin: 3px 0;"></select>
					<select style="width: 90%; margin: 3px 0;"></select>
				</td>
				<td style="text-align: center;"><button type="button" class="btn btn-success">เพิ่ม</button></td>
			</tr>
			
		</tbody>
		</table>
		
		<div style="text-align: center;">
		<table id="table_event_list" style="display: inline-block;">
		<tbody>
			<tr>
				<td>60'</td>
				<td>ราชบุรี</td>
				<td><img src="images/icon_event/sub.png" class="event"></td>
				<td>
					5) ปิยวัชร์ ปราชญ์ศิลป์ (goal)<br>5) ปิยวัชร์ ปราชญ์ศิลป์ (goal)
				</td>
				<td><img src="images/remove.png" style="width: 20px; cursor: pointer;"></td>
			</tr>
		</tbody>
		</table>
		</div>
		
	</div>
	
	<div id="div_loading">
		<img src="images/loading2.gif">
	</div>
	
	<!-- Template Player-->
	<div id="temp_player" style="display: none;">
	
		<div class="player" data-playerId="0">
			<input type="radio" name="captain_home" class="captain">
			<input type="number" style="width: 70px; text-align: center; font-size: 16px;">
			<span style="font-size: 16px; padding-left: 5px;">ศิลา ศรีกำปัง</span>
			<img src="images/remove.png" class="remove_player" data-playerId="0">
			<img src="images/asterisk.png" style="position: absolute; top: 5px; right: 40px; width: 20px;">
		</div>
		
	</div>

</body>

<script>

$(document).ready(function(){

	countHomeStartXi();
	countAwayStartXi();
	select2Player();
	onclickRemovePlayer();

	$('[data-toggle="tooltip"]').tooltip();
});

function countHomeStartXi() {
	$('#text_count_home_start').text( $('#div_home_start11 .player').length );
}

function countAwayStartXi() {
	$('#text_count_away_start').text( $('#div_away_start11 .player').length );
}

function select2Player() {
	$("select.player").select2({
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
	$('img.remove_player').click(function(){
		iPlayerId = $(this).attr('data-playerId');
		$('div.player[data-playerId=' + iPlayerId + ']').remove();
		countHomeStartXi();
		countAwayStartXi();
		if( $('#div_home_start11 div.player').length == 0 )
			$('#div_home_start11').html('<p style="color: #D9D9D9; margin-top: 20px; text-align: center; font-size: 20px;">ยังไม่ได้เพิ่มผู้เล่น</p>');
		if( $('#div_away_start11 div.player').length == 0 )
			$('#div_away_start11').html('<p style="color: #D9D9D9; margin-top: 20px; text-align: center; font-size: 20px;">ยังไม่ได้เพิ่มผู้เล่น</p>');
		if( $('#div_home_sub div.player').length == 0 )
			$('#div_home_sub').html('<p style="color: #D9D9D9; margin-top: 20px; text-align: center; font-size: 20px;">ยังไม่ได้เพิ่มผู้เล่น</p>');
		if( $('#div_away_sub div.player').length == 0 )
			$('#div_away_sub').html('<p style="color: #D9D9D9; margin-top: 20px; text-align: center; font-size: 20px;">ยังไม่ได้เพิ่มผู้เล่น</p>');
	});
}

function onclickAddPlayer() {
	$('#btn_add_home_start').click(function(){
		
	});
}

</script>

</html>

