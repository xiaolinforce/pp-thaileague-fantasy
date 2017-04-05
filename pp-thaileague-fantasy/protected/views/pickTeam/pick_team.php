
<style>

#div_pickteam_cover {
	text-align: center;
	background-image: url('images/pitch.png'); 
	background-repeat: no-repeat; 
	background-position: center;
	background-size: contain;
	margin-top: 20px;
}

.cell_player {
	padding: 6px; 
	cursor: pointer;
	position: relative;
}

.cell_player_teambg {
	width: 100px; 
	height: 50px;
	border-radius: 10px 10px 0 0;
}

.cell_player_player {
	width: 100px;
}

.cell_player_team {
	width: 100px;
	border-radius: 0 0 10px 10px;
}

.cell_player_captain {
	text-align: center;
	position: absolute;
	width: 22px;
	height: 23px;
	color: white;
	background-color: #b31f24;
	border-radius: 7px;
	border: 2px solid white;
	top: 10px;
	left: 10px;
}

.cell_player_banned {
	text-align: center;
	position: absolute;
	width: 22px;
	height: 22px;
	color: white;
	background-color: #FF2929;
	border-radius: 7px;
	border: 2px solid white;
	top: 10px;
	right: 10px;
}

#cell_fixture {
	padding: 10px 20px; 
	background-color: #b31f24; 
	color: white; 
	border-radius: 10px 0 0 10px;
}

#cell_deadline {
	text-align: left; 
	padding: 10px 20px; 
	background-color: #FFF0F1; 
	border-radius: 0 10px 10px 0; 
	color: #b31f24;
}

</style>

<div style="text-align: center;">
	<table style="display: inline; font-size: 16px;">
		<tr>
			<td id="cell_fixture">Fixture 1</td>
			<td id="cell_deadline">
				หมดเวลา:<br>14 ม.ค. 2560 [18:00]
			</td>
		</tr>
	</table>
</div>

<div id="div_pickteam_cover">
	<table id="table_gk" style="display: inline; border-collapse: separate;">
		<tr>
			<td data-playerId="1" data-teamId="1" data-position="gk" data-canChange="1" class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
				<div class="cell_player_teambg" style="background-image: url('images/team_background_squad/muang_thong.png'); background-size: cover;"></div>
				<div class="cell_player_player" style="background-color: #FFDBDC; color: #b31f24;">กวิน</div>
				<div class="cell_player_team" style="background-color: #b31f24; color: #FFDBDC;">เมืองทอง</div>
			</td>
		</tr>
	</table>
	<br>
	
	<table id="table_df" style="display: inline; border-collapse: separate;">
		<tr>
			<td data-playerId="1" data-teamId="1" data-position="df" data-canChange="1" class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
				<div class="cell_player_teambg" style="background-image: url('images/team_background_squad/muang_thong.png'); background-size: cover;"></div>
				<div class="cell_player_player" style="background-color: #E1DFF7; color: #04003E;">Túñez</div>
				<div class="cell_player_team" style="background-color: #04003E; color: #E1DFF7;">บุรีรัมย์</div>
			</td>
		</tr>
	</table>
	<br>
	
	<table id="table_md" style="display: inline; border-collapse: separate;">
		<tr>
			<td data-playerId="1" data-teamId="1" data-position="md" data-canChange="1" class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
				<div class="cell_player_teambg" style="background-image: url('images/team_background_squad/muang_thong.png'); background-size: cover;"></div>
				<div class="cell_player_player" style="background-color: #FFDBDC; color: #b31f24;">Sho Shimoji</div>
				<div class="cell_player_team" style="background-color: #b31f24; color: #FFDBDC;">ชัยนาท</div>
			</td>
		</tr>
	</table>
	<br>
	
	<table id="table_fw" style="display: inline; border-collapse: separate;">
		<tr>
			<td data-playerId="1" data-teamId="1" data-position="fw" data-canChange="1" class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
				<div class="cell_player_teambg" style="background-image: url('images/team_background_squad/muang_thong.png'); background-size: cover;"></div>
				<div class="cell_player_player" style="background-color: #FFDBDC; color: #b31f24;">Yannick</div>
				<div class="cell_player_team" style="background-color: #b31f24; color: #FFDBDC;">ราชบุรี</div>
			</td>
		</tr>
	</table>
	<br>

</div>

<div style="text-align: center; margin-top: 10px;">
	<table id="table_sub" style="display: inline; border-collapse: separate;">
		<tr>
			<td style="color: #b31f24; font-weight: bold; font-size: 20px; padding-right: 10px;">ตัวสำรอง :</td>
			<td data-playerId="1" data-teamId="1" data-position="gk" data-canChange="1" class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
				<div class="cell_player_teambg" style="background-image: url('images/team_background_squad/muang_thong.png'); background-size: cover;"></div>
				<div class="cell_player_player" style="background-color: #FFDBDC; color: #b31f24;">Hart</div>
				<div class="cell_player_team" style="background-color: #b31f24; color: #FFDBDC;">Torino</div>
			</td>
			<td data-playerId="1" data-teamId="1" data-position="fw" data-canChange="1" class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
				<div class="cell_player_teambg" style="background-image: url('images/team_background_squad/muang_thong.png'); background-size: cover;"></div>
				<div class="cell_player_player" style="background-color: #FFDBDC; color: #b31f24;">Yannick</div>
				<div class="cell_player_team" style="background-color: #b31f24; color: #FFDBDC;">ราชบุรี</div>
			</td>
			<td data-playerId="1" data-teamId="1" data-position="md" data-canChange="1" class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
				<div class="cell_player_teambg" style="background-image: url('images/team_background_squad/muang_thong.png'); background-size: cover;"></div>
				<div class="cell_player_player" style="background-color: #FFDBDC; color: #b31f24;">Yannick</div>
				<div class="cell_player_team" style="background-color: #b31f24; color: #FFDBDC;">ราชบุรี</div>
			</td>
			<td data-playerId="1" data-teamId="1" data-position="df" data-canChange="1" class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
				<div class="cell_player_teambg" style="background-image: url('images/team_background_squad/muang_thong.png'); background-size: cover;"></div>
				<div class="cell_player_player" style="background-color: #FFDBDC; color: #b31f24;">Yannick</div>
				<div class="cell_player_team" style="background-color: #b31f24; color: #FFDBDC;">ราชบุรี</div>
			</td>
		</tr>
	</table>
</div>

<button id="btn_save" type="button" class="btn btn-success btn-lg" style="position: fixed; bottom: 10px; right: 10px;" onclick="onclickSave()">บันทึกการจัดตัว</button>
<div style="position: fixed; bottom: 10px; left: 10px;">
	<button id="btn_captain" type="button" class="btn btn-primary btn-lg" style="display: none;" onclick="onclickSetCaptain()">ตั้งกัปตัน</button>
	<button id="btn_player_info" type="button" class="btn btn-default btn-lg" style="display: none;" onclick="">ดูข้อมูล</button>
	<button id="btn_cancel_move" type="button" class="btn btn-warning btn-lg" style="display: none;" onclick="onclickCancelMove()">ยกเลิก</button>
</div>

<div style="display: none;">
	<table id="temp_table_player" style="display: inline;">
		<tr>
			<td data-playerId="1" data-teamId="1" data-position="gk" data-canChange="1" class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
				<div class="cell_player_teambg" style="background-image: url('images/team_background_squad/muang_thong.png'); background-size: cover;"></div>
				<div class="cell_player_player" style="background-color: #FFDBDC; color: #b31f24;">Túñez</div>
				<div class="cell_player_team" style="background-color: #b31f24; color: #FFDBDC;">บุรีรัมย์</div>
			</td>
		</tr>
	</table>
</div>

<script>

var gk, df, md, fw, sub_gk, sub_other;
var isChoosingPlayer = false;
var choosingPlayerId = 0;
var choosingPosition = "";

$(document).ready(function(){
	setDeadline("<?= $sFixture ?>", "<?= $sTimeout ?>");
	initSetting();
	setSquad();
	onclickPlayer();
});

function setDeadline(fixture, datetime) {
	$('#cell_fixture').html(fixture);
	$('#cell_deadline').html("หมดเวลา:<br>" + datetime);
}

function initSetting() {
	gk = {
		teamBg: "<?= $aGk['teamBg'] ?>", 
		colorLight: "<?= $aGk['colorLight'] ?>",
		colorDark: "<?= $aGk['colorDark'] ?>",
		playerId: <?= $aGk['playerId'] ?>,
		playerName: "<?= $aGk['playerName'] ?>",
		teamId: <?= $aGk['teamId'] ?>,
		teamName: "<?= $aGk['teamName'] ?>",
		position: "<?= $aGk['position'] ?>",
		captain: <?= $aGk['captain'] ?>,
		banMessage: ""
	};

	df = [];
	<?php 
		foreach( $aDf as $aEachDf ) {
	?>
	df.push({
		teamBg: "<?= $aEachDf['teamBg'] ?>", 
		colorLight: "<?= $aEachDf['colorLight'] ?>",
		colorDark: "<?= $aEachDf['colorDark'] ?>",
		playerId: <?= $aEachDf['playerId'] ?>,
		playerName: "<?= $aEachDf['playerName'] ?>",
		teamId: <?= $aEachDf['teamId'] ?>,
		teamName: "<?= $aEachDf['teamName'] ?>",
		position: "<?= $aEachDf['position'] ?>",
		captain: <?= $aEachDf['captain'] ?>,
		banMessage: ""
	});
	<?php 
		}
	?>

	md = [];
	<?php 
		foreach( $aMd as $aEachMd ) {
	?>
	md.push({
		teamBg: "<?= $aEachMd['teamBg'] ?>", 
		colorLight: "<?= $aEachMd['colorLight'] ?>",
		colorDark: "<?= $aEachMd['colorDark'] ?>",
		playerId: <?= $aEachMd['playerId'] ?>,
		playerName: "<?= $aEachMd['playerName'] ?>",
		teamId: <?= $aEachMd['teamId'] ?>,
		teamName: "<?= $aEachMd['teamName'] ?>",
		position: "<?= $aEachMd['position'] ?>",
		captain: <?= $aEachMd['captain'] ?>,
		banMessage: ""
	});
	<?php 
		}
	?>

	fw = [];
	<?php 
		foreach( $aFw as $aEachFw ) {
	?>
	fw.push({
		teamBg: "<?= $aEachFw['teamBg'] ?>", 
		colorLight: "<?= $aEachFw['colorLight'] ?>",
		colorDark: "<?= $aEachFw['colorDark'] ?>",
		playerId: <?= $aEachFw['playerId'] ?>,
		playerName: "<?= $aEachFw['playerName'] ?>",
		teamId: <?= $aEachFw['teamId'] ?>,
		teamName: "<?= $aEachFw['teamName'] ?>",
		position: "<?= $aEachFw['position'] ?>",
		captain: <?= $aEachFw['captain'] ?>,
		banMessage: ""
	});
	<?php 
		}
	?>

	sub_gk = {
		teamBg: "<?= $aGkSub['teamBg'] ?>", 
		colorLight: "<?= $aGkSub['colorLight'] ?>",
		colorDark: "<?= $aGkSub['colorDark'] ?>",
		playerId: <?= $aGkSub['playerId'] ?>,
		playerName: "<?= $aGkSub['playerName'] ?>",
		teamId: <?= $aGkSub['teamId'] ?>,
		teamName: "<?= $aGkSub['teamName'] ?>",
		position: "<?= $aGkSub['position'] ?>",
		captain: <?= $aGkSub['captain'] ?>,
		banMessage: ""
	};

	sub_other = [];
	<?php 
		foreach( $aSub as $aEachSub ) {
	?>
	sub_other.push({
		teamBg: "<?= $aEachSub['teamBg'] ?>", 
		colorLight: "<?= $aEachSub['colorLight'] ?>",
		colorDark: "<?= $aEachSub['colorDark'] ?>",
		playerId: <?= $aEachSub['playerId'] ?>,
		playerName: "<?= $aEachSub['playerName'] ?>",
		teamId: <?= $aEachSub['teamId'] ?>,
		teamName: "<?= $aEachSub['teamName'] ?>",
		position: "<?= $aEachSub['position'] ?>",
		captain: <?= $aEachSub['captain'] ?>,
		banMessage: ""
	});
	<?php 
		}
	?>
}

function setBanDiv() {
	
	$('.cell_player_banned').remove();
	
	if( gk.banMessage != "" )
		$('#table_gk td').append('<div class="cell_player_banned">!</div>');
	for( i = 0; i < df.length; i++ ) {
		if( df[i].banMessage != "" )
			$('#table_df td').eq(i).append('<div class="cell_player_banned">!</div>');
	}
	for( i = 0; i < md.length; i++ ) {
		if( md[i].banMessage != "" )
			$('#table_md td').eq(i).append('<div class="cell_player_banned">!</div>');
	}
	for( i = 0; i < fw.length; i++ ) {
		if( fw[i].banMessage != "" )
			$('#table_fw td').eq(i).append('<div class="cell_player_banned">!</div>');
	}
	if( sub_gk.banMessage != "" )
		$('#table_sub td:eq(1)').append('<div class="cell_player_banned">!</div>');
	for( i = 0; i < sub_other.length; i++ ) {
		if( sub_other[i].banMessage != "" )
			$('#table_sub td').eq(i+2).append('<div class="cell_player_banned">!</div>');
	}
}

function setSquad() {

	setDefaultCaptain();
	
	$('#table_gk div:eq(0)').css("background-image", "url('" + gk.teamBg + "')");
	$('#table_gk div:eq(1)').css("background-color", gk.colorLight);
	$('#table_gk div:eq(1)').css("color", gk.colorDark);
	$('#table_gk div:eq(1)').html(gk.playerName);
	$('#table_gk div:eq(2)').css("background-color", gk.colorDark);
	$('#table_gk div:eq(2)').css("color", gk.colorLight);
	$('#table_gk div:eq(2)').html(gk.teamName);
	$('#table_gk td').attr("data-playerId", gk.playerId);
	$('#table_gk td').attr("data-teamId", gk.teamId);
	$('#table_gk td').attr("data-position", gk.position);
	$('#table_gk td div.cell_player_captain').remove();
	if( gk.captain )	$('#table_gk td').append('<div class="cell_player_captain">C</div>');

	html = "";
	for(i = 0; i < df.length; i++) {
		$('#temp_table_player div:eq(0)').css("background-image", "url('" + df[i].teamBg + "')");
		$('#temp_table_player div:eq(1)').css("background-color", df[i].colorLight);
		$('#temp_table_player div:eq(1)').css("color", df[i].colorDark);
		$('#temp_table_player div:eq(1)').html(df[i].playerName);
		$('#temp_table_player div:eq(2)').css("background-color", df[i].colorDark);
		$('#temp_table_player div:eq(2)').css("color", df[i].colorLight);
		$('#temp_table_player div:eq(2)').html(df[i].teamName);
		$('#temp_table_player td').attr("data-playerId", df[i].playerId);
		$('#temp_table_player td').attr("data-teamId", df[i].teamId);
		$('#temp_table_player td').attr("data-position", df[i].position);
		$('#temp_table_player td div.cell_player_captain').remove();
		if( df[i].captain )	$('#temp_table_player td').append('<div class="cell_player_captain">C</div>');
		html = html + $('#temp_table_player tr').html();
	}
	$('#table_df tr').html(html);

	html = "";
	for(i = 0; i < md.length; i++) {
		$('#temp_table_player div:eq(0)').css("background-image", "url('" + md[i].teamBg + "')");
		$('#temp_table_player div:eq(1)').css("background-color", md[i].colorLight);
		$('#temp_table_player div:eq(1)').css("color", md[i].colorDark);
		$('#temp_table_player div:eq(1)').html(md[i].playerName);
		$('#temp_table_player div:eq(2)').css("background-color", md[i].colorDark);
		$('#temp_table_player div:eq(2)').css("color", md[i].colorLight);
		$('#temp_table_player div:eq(2)').html(md[i].teamName);
		$('#temp_table_player td').attr("data-playerId", md[i].playerId);
		$('#temp_table_player td').attr("data-teamId", md[i].teamId);
		$('#temp_table_player td').attr("data-position", md[i].position);
		$('#temp_table_player td div.cell_player_captain').remove();
		if( md[i].captain )	$('#temp_table_player td').append('<div class="cell_player_captain">C</div>');
		html = html + $('#temp_table_player tr').html();
	}
	$('#table_md tr').html(html);

	html = "";
	for(i = 0; i < fw.length; i++) {
		$('#temp_table_player div:eq(0)').css("background-image", "url('" + fw[i].teamBg + "')");
		$('#temp_table_player div:eq(1)').css("background-color", fw[i].colorLight);
		$('#temp_table_player div:eq(1)').css("color", fw[i].colorDark);
		$('#temp_table_player div:eq(1)').html(fw[i].playerName);
		$('#temp_table_player div:eq(2)').css("background-color", fw[i].colorDark);
		$('#temp_table_player div:eq(2)').css("color", fw[i].colorLight);
		$('#temp_table_player div:eq(2)').html(fw[i].teamName);
		$('#temp_table_player td').attr("data-playerId", fw[i].playerId);
		$('#temp_table_player td').attr("data-teamId", fw[i].teamId);
		$('#temp_table_player td').attr("data-position", fw[i].position);
		$('#temp_table_player td div.cell_player_captain').remove();
		if( fw[i].captain )	$('#temp_table_player td').append('<div class="cell_player_captain">C</div>');
		html = html + $('#temp_table_player tr').html();
	}
	$('#table_fw tr').html(html);

	$('#table_sub td:eq(1) div:eq(0)').css("background-image", "url('" + sub_gk.teamBg + "')");
	$('#table_sub td:eq(1) div:eq(1)').css("background-color", sub_gk.colorLight);
	$('#table_sub td:eq(1) div:eq(1)').css("color", sub_gk.colorDark);
	$('#table_sub td:eq(1) div:eq(1)').html(sub_gk.playerName);
	$('#table_sub td:eq(1) div:eq(2)').css("background-color", sub_gk.colorDark);
	$('#table_sub td:eq(1) div:eq(2)').css("color", sub_gk.colorLight);
	$('#table_sub td:eq(1) div:eq(2)').html(sub_gk.teamName);
	$('#table_sub td:eq(1)').attr("data-playerId", sub_gk.playerId);
	$('#table_sub td:eq(1)').attr("data-teamId", sub_gk.teamId);
	$('#table_sub td:eq(1)').attr("data-position", sub_gk.position);
	
	for(i = 0; i < sub_other.length; i++) {
		$('#table_sub td:eq('+(2+i)+') div:eq(0)').css("background-image", "url('" + sub_other[i].teamBg + "')");
		$('#table_sub td:eq('+(2+i)+') div:eq(1)').css("background-color", sub_other[i].colorLight);
		$('#table_sub td:eq('+(2+i)+') div:eq(1)').css("color", sub_other[i].colorDark);
		$('#table_sub td:eq('+(2+i)+') div:eq(1)').html(sub_other[i].playerName);
		$('#table_sub td:eq('+(2+i)+') div:eq(2)').css("background-color", sub_other[i].colorDark);
		$('#table_sub td:eq('+(2+i)+') div:eq(2)').css("color", sub_other[i].colorLight);
		$('#table_sub td:eq('+(2+i)+') div:eq(2)').html(sub_other[i].teamName);
		$('#table_sub td:eq('+(2+i)+')').attr("data-playerId", sub_other[i].playerId);
		$('#table_sub td:eq('+(2+i)+')').attr("data-teamId", sub_other[i].teamId);
		$('#table_sub td:eq('+(2+i)+')').attr("data-position", sub_other[i].position);
	}

	setBanDiv();
}

function onclickPlayer() {
	$('#table_gk td').click(function(){
		if( isChoosingPlayer ) {
			canChange = $(this).attr("data-canChange") == "1";
			swapPlayer(choosingPlayerId, $(this).attr("data-playerId"), canChange);
			if(canChange) {
				isChoosingPlayer = false;
				$('#btn_save').show();
				$('#btn_cancel_move').hide();
				$('#btn_captain').hide();
				$('#btn_player_info').hide();
			}
		}
		else {
			choosingPlayerId = $(this).attr("data-playerId");
			choosingPosition = $(this).attr("data-position");
			isChoosingPlayer = true;
			$('#table_sub td:eq(1)').attr("data-canChange", "1");
			$('#table_gk td, #table_df td, #table_md td, #table_fw td, #table_sub td:eq(2), #table_sub td:eq(3), #table_sub td:eq(4)').attr("data-canChange", "0");
			$('#table_gk td, #table_df td, #table_md td, #table_fw td, #table_sub td:eq(2), #table_sub td:eq(3), #table_sub td:eq(4)').css("border", "2px solid #FF4040");
			$('#table_sub td:eq(1)').css("border", "2px solid #64FF41");
			$(this).css("border", "2px solid #FCFF00");
			$('#btn_save').hide();
			$('#btn_cancel_move').show();
			$('#btn_captain').show();
			$('#btn_player_info').show();
		}
	});

	$('#table_df').delegate('td', 'click', function(){
		if( isChoosingPlayer ) {
			canChange = $(this).attr("data-canChange") == "1";
			swapPlayer(choosingPlayerId, $(this).attr("data-playerId"), canChange);
			if(canChange) {
				isChoosingPlayer = false;
				$('#btn_save').show();
				$('#btn_cancel_move').hide();
				$('#btn_captain').hide();
				$('#btn_player_info').hide();
			}
		}
		else {
			choosingPlayerId = $(this).attr("data-playerId");
			choosingPosition = $(this).attr("data-position");
			isChoosingPlayer = true;
			$('#table_sub td:eq(2), #table_sub td:eq(3), #table_sub td:eq(4)').attr("data-canChange", "1");
			$('#table_gk td, #table_df td, #table_md td, #table_fw td, #table_sub td:eq(1)').attr("data-canChange", "0");
			$('#table_gk td, #table_df td, #table_md td, #table_fw td, #table_sub td:eq(1)').css("border", "2px solid #FF4040");
			$('#table_sub td:eq(2), #table_sub td:eq(3), #table_sub td:eq(4)').css("border", "2px solid #64FF41");

			bMd = true;
			bFw = true;
			if( df.length == 3 || md.length == 5 )	bMd = false;
			if( df.length == 3 || fw.length == 3 )	bFw = false;
			if( $('#table_sub td:eq(2)').attr("data-position") == "md" && !bMd ) {
				$('#table_sub td:eq(2)').css("border", "2px solid #FF4040");
				$('#table_sub td:eq(2)').attr("data-canChange", "0");
			}
			if( $('#table_sub td:eq(2)').attr("data-position") == "fw" && !bFw ) {
				$('#table_sub td:eq(2)').css("border", "2px solid #FF4040");
				$('#table_sub td:eq(2)').attr("data-canChange", "0");
			}
			if( $('#table_sub td:eq(3)').attr("data-position") == "md" && !bMd ) {
				$('#table_sub td:eq(3)').css("border", "2px solid #FF4040");
				$('#table_sub td:eq(3)').attr("data-canChange", "0");
			}
			if( $('#table_sub td:eq(3)').attr("data-position") == "fw" && !bFw ) {
				$('#table_sub td:eq(3)').css("border", "2px solid #FF4040");
				$('#table_sub td:eq(3)').attr("data-canChange", "0");
			}
			if( $('#table_sub td:eq(4)').attr("data-position") == "md" && !bMd ) {
				$('#table_sub td:eq(4)').css("border", "2px solid #FF4040");
				$('#table_sub td:eq(4)').attr("data-canChange", "0");
			}
			if( $('#table_sub td:eq(4)').attr("data-position") == "fw" && !bFw ) {
				$('#table_sub td:eq(4)').css("border", "2px solid #FF4040");
				$('#table_sub td:eq(4)').attr("data-canChange", "0");
			}

			$(this).css("border", "2px solid #FCFF00");
			$('#btn_save').hide();
			$('#btn_cancel_move').show();
			$('#btn_captain').show();
			$('#btn_player_info').show();
		}
	});

	$('#table_md').delegate('td', 'click', function(){
		if( isChoosingPlayer ) {
			canChange = $(this).attr("data-canChange") == "1";
			swapPlayer(choosingPlayerId, $(this).attr("data-playerId"), canChange);
			if(canChange) {
				isChoosingPlayer = false;
				$('#btn_save').show();
				$('#btn_cancel_move').hide();
				$('#btn_captain').hide();
				$('#btn_player_info').hide();
			}
		}
		else {
			choosingPlayerId = $(this).attr("data-playerId");
			choosingPosition = $(this).attr("data-position");
			isChoosingPlayer = true;
			$('#table_sub td:eq(2), #table_sub td:eq(3), #table_sub td:eq(4)').attr("data-canChange", "1");
			$('#table_gk td, #table_df td, #table_md td, #table_fw td, #table_sub td:eq(1)').attr("data-canChange", "0");
			$('#table_gk td, #table_df td, #table_md td, #table_fw td, #table_sub td:eq(1)').css("border", "2px solid #FF4040");
			$('#table_sub td:eq(2), #table_sub td:eq(3), #table_sub td:eq(4)').css("border", "2px solid #64FF41");

			bDf = true;
			bFw = true;
			if( md.length == 2 || df.length == 5 )	bDf = false;
			if( md.length == 2 || fw.length == 3 )	bFw = false;
			if( $('#table_sub td:eq(2)').attr("data-position") == "df" && !bDf ) {
				$('#table_sub td:eq(2)').css("border", "2px solid #FF4040");
				$('#table_sub td:eq(2)').attr("data-canChange", "0");
			}
			if( $('#table_sub td:eq(2)').attr("data-position") == "fw" && !bFw ) {
				$('#table_sub td:eq(2)').css("border", "2px solid #FF4040");
				$('#table_sub td:eq(2)').attr("data-canChange", "0");
			}
			if( $('#table_sub td:eq(3)').attr("data-position") == "df" && !bDf ) {
				$('#table_sub td:eq(3)').css("border", "2px solid #FF4040");
				$('#table_sub td:eq(3)').attr("data-canChange", "0");
			}
			if( $('#table_sub td:eq(3)').attr("data-position") == "fw" && !bFw ) {
				$('#table_sub td:eq(3)').css("border", "2px solid #FF4040");
				$('#table_sub td:eq(3)').attr("data-canChange", "0");
			}
			if( $('#table_sub td:eq(4)').attr("data-position") == "df" && !bDf ) {
				$('#table_sub td:eq(4)').css("border", "2px solid #FF4040");
				$('#table_sub td:eq(4)').attr("data-canChange", "0");
			}
			if( $('#table_sub td:eq(4)').attr("data-position") == "fw" && !bFw ) {
				$('#table_sub td:eq(4)').css("border", "2px solid #FF4040");
				$('#table_sub td:eq(4)').attr("data-canChange", "0");
			}

			$(this).css("border", "2px solid #FCFF00");
			$('#btn_save').hide();
			$('#btn_cancel_move').show();
			$('#btn_captain').show();
			$('#btn_player_info').show();
		}
	});

	$('#table_fw').delegate('td', 'click', function(){
		if( isChoosingPlayer ) {
			canChange = $(this).attr("data-canChange") == "1";
			swapPlayer(choosingPlayerId, $(this).attr("data-playerId"), canChange);
			if(canChange) {
				isChoosingPlayer = false;
				$('#btn_save').show();
				$('#btn_cancel_move').hide();
				$('#btn_captain').hide();
				$('#btn_player_info').hide();
			}
		}
		else {
			choosingPlayerId = $(this).attr("data-playerId");
			choosingPosition = $(this).attr("data-position");
			isChoosingPlayer = true;
			$('#table_sub td:eq(2), #table_sub td:eq(3), #table_sub td:eq(4)').attr("data-canChange", "1");
			$('#table_gk td, #table_df td, #table_md td, #table_fw td, #table_sub td:eq(1)').attr("data-canChange", "0");
			$('#table_gk td, #table_df td, #table_md td, #table_fw td, #table_sub td:eq(1)').css("border", "2px solid #FF4040");
			$('#table_sub td:eq(2), #table_sub td:eq(3), #table_sub td:eq(4)').css("border", "2px solid #64FF41");

			bDf = true;
			bMd = true;
			if( fw.length == 1 || df.length == 5 )	bDf = false;
			if( fw.length == 1 || md.length == 5 )	bMd = false;
			if( $('#table_sub td:eq(2)').attr("data-position") == "df" && !bDf ) {
				$('#table_sub td:eq(2)').css("border", "2px solid #FF4040");
				$('#table_sub td:eq(2)').attr("data-canChange", "0");
			}
			if( $('#table_sub td:eq(2)').attr("data-position") == "md" && !bMd ) {
				$('#table_sub td:eq(2)').css("border", "2px solid #FF4040");
				$('#table_sub td:eq(2)').attr("data-canChange", "0");
			}
			if( $('#table_sub td:eq(3)').attr("data-position") == "df" && !bDf ) {
				$('#table_sub td:eq(3)').css("border", "2px solid #FF4040");
				$('#table_sub td:eq(3)').attr("data-canChange", "0");
			}
			if( $('#table_sub td:eq(3)').attr("data-position") == "md" && !bMd ) {
				$('#table_sub td:eq(3)').css("border", "2px solid #FF4040");
				$('#table_sub td:eq(3)').attr("data-canChange", "0");
			}
			if( $('#table_sub td:eq(4)').attr("data-position") == "df" && !bDf ) {
				$('#table_sub td:eq(4)').css("border", "2px solid #FF4040");
				$('#table_sub td:eq(4)').attr("data-canChange", "0");
			}
			if( $('#table_sub td:eq(4)').attr("data-position") == "md" && !bMd ) {
				$('#table_sub td:eq(4)').css("border", "2px solid #FF4040");
				$('#table_sub td:eq(4)').attr("data-canChange", "0");
			}

			$(this).css("border", "2px solid #FCFF00");
			$('#btn_save').hide();
			$('#btn_cancel_move').show();
			$('#btn_captain').show();
			$('#btn_player_info').show();
		}
	});

	$('#table_sub td:eq(1)').click(function(){
		if( isChoosingPlayer ) {
			canChange = $(this).attr("data-canChange") == "1";
			swapPlayer(choosingPlayerId, $(this).attr("data-playerId"), canChange);
			if(canChange) {
				isChoosingPlayer = false;
				$('#btn_save').show();
				$('#btn_cancel_move').hide();
				$('#btn_captain').hide();
				$('#btn_player_info').hide();
			}
		}
		else {
			choosingPlayerId = $(this).attr("data-playerId");
			choosingPosition = $(this).attr("data-position");
			isChoosingPlayer = true;
			$('#table_gk td').attr("data-canChange", "1");
			$('#table_df td, #table_md td, #table_fw td, #table_sub td:eq(1), #table_sub td:eq(2), #table_sub td:eq(3), #table_sub td:eq(4)').attr("data-canChange", "0");
			$('#table_df td, #table_md td, #table_fw td, #table_sub td:eq(1), #table_sub td:eq(2), #table_sub td:eq(3), #table_sub td:eq(4)').css("border", "2px solid #FF4040");
			$('#table_gk td').css("border", "2px solid #64FF41");
			$(this).css("border", "2px solid #FCFF00");
			$('#btn_save').hide();
			$('#btn_cancel_move').show();
			$('#btn_player_info').show();
		}
	});

	$('#table_sub td:eq(2), #table_sub td:eq(3), #table_sub td:eq(4)').click(function(){
		if( isChoosingPlayer ) {
			canChange = $(this).attr("data-canChange") == "1";
			swapPlayer(choosingPlayerId, $(this).attr("data-playerId"), canChange);
			if(canChange) {
				isChoosingPlayer = false;
				$('#btn_save').show();
				$('#btn_cancel_move').hide();
				$('#btn_captain').hide();
				$('#btn_player_info').hide();
			}
		}
		else {
			choosingPlayerId = $(this).attr("data-playerId");
			choosingPosition = $(this).attr("data-position");
			isChoosingPlayer = true;
			$('#table_df td, #table_md td, #table_fw td').attr("data-canChange", "1");
			$('#table_gk td, #table_sub td:eq(1), #table_sub td:eq(2), #table_sub td:eq(3), #table_sub td:eq(4)').attr("data-canChange", "0");
			$('#table_df td, #table_md td, #table_fw td').css("border", "2px solid #64FF41");
			$('#table_gk td, #table_sub td:eq(1), #table_sub td:eq(2), #table_sub td:eq(3), #table_sub td:eq(4)').css("border", "2px solid #FF4040");

			if( $(this).attr("data-position") == "df" ) {
				if( md.length == 2 || df.length == 5 ) {
					$('#table_md td').css("border", "2px solid #FF4040");
					$('#table_md td').attr("data-canChange", "0");
				}
				if( fw.length == 1 || df.length == 5 ) {
					$('#table_fw td').css("border", "2px solid #FF4040");
					$('#table_fw td').attr("data-canChange", "0");
				}
			}
			else if( $(this).attr("data-position") == "md" ) {
				if( df.length == 3 || md.length == 5 ) {
					$('#table_df td').css("border", "2px solid #FF4040");
					$('#table_df td').attr("data-canChange", "0");
				}
				if( fw.length == 1 || md.length == 5 ) {
					$('#table_fw td').css("border", "2px solid #FF4040");
					$('#table_fw td').attr("data-canChange", "0");
				}
			}
			else {
				if( df.length == 3 || fw.length == 3 ) {
					$('#table_df td').css("border", "2px solid #FF4040");
					$('#table_df td').attr("data-canChange", "0");
				}
				if( md.length == 2 || fw.length == 3 ) {
					$('#table_md td').css("border", "2px solid #FF4040");
					$('#table_md td').attr("data-canChange", "0");
				}
			}

			$(this).css("border", "2px solid #FCFF00");
			$('#btn_save').hide();
			$('#btn_cancel_move').show();
			$('#btn_player_info').show();
		}
	});
}

function onclickCancelMove() {
	isChoosingPlayer = false;
	$('#table_gk td, #table_df td, #table_md td, #table_fw td, #table_sub td').css("border", "2px solid rgba(0, 0, 0, 0)");
	$('#btn_save').show();
	$('#btn_cancel_move').hide();
	$('#btn_captain').hide();
	$('#btn_player_info').hide();
}

function setDefaultCaptain() {
	if( sub_gk.captain || sub_other[0].captain || sub_other[1].captain || sub_other[2].captain ) {
		sub_gk.captain = false;
		sub_other[0].captain = false;
		sub_other[1].captain = false;
		sub_other[2].captain = false;
		gk.captain = true;
	}
}

</script>

<!-- SCRIPT for swapping player -->
<script>

function swapPlayer(playerId1, playerId2, canSwap) {

	if(!canSwap) {
		showModal('ไม่สามารถเปลี่ยนสลับนักเตะได้', 'ไม่สามารถเปลี่ยนสลับนักเตะได้ กรุณาเปลี่ยนสลับกับนักเตะที่มีกรอบสีเขียวล้อมรอบ', false);
		return;
	}
	
	/* Get Player 1 Detail */
	if( gk.playerId == playerId1 ) {
		player1Position = "gk";
		player1PosIndex = 0;
		player1 = gk;
	}

	for( i = 0; i < df.length; i++ ) {
		if( df[i].playerId == playerId1 ) {
			player1Position = "df";
			player1PosIndex = i;
			player1 = df[i];
		}
	}

	for( i = 0; i < md.length; i++ ) {
		if( md[i].playerId == playerId1 ) {
			player1Position = "md";
			player1PosIndex = i;
			player1 = md[i];
		}
	}

	for( i = 0; i < fw.length; i++ ) {
		if( fw[i].playerId == playerId1 ) {
			player1Position = "fw";
			player1PosIndex = i;
			player1 = fw[i]
		}
	}

	if( sub_gk.playerId == playerId1 ) {
		player1Position = "sub_gk";
		player1PosIndex = 0;
		player1 = sub_gk;
	}

	for( i = 0; i < sub_other.length; i++ ) {
		if( sub_other[i].playerId == playerId1 ) {
			player1Position = "sub";
			player1PosIndex = i;
			player1 = sub_other[i];
		}
	}

	/* Get Player 2 Detail */
	if( gk.playerId == playerId2 ) {
		player2Position = "gk";
		player2PosIndex = 0;
		player2 = gk;
	}

	for( i = 0; i < df.length; i++ ) {
		if( df[i].playerId == playerId2 ) {
			player2Position = "df";
			player2PosIndex = i;
			player2 = df[i];
		}
	}

	for( i = 0; i < md.length; i++ ) {
		if( md[i].playerId == playerId2 ) {
			player2Position = "md";
			player2PosIndex = i;
			player2 = md[i];
		}
	}

	for( i = 0; i < fw.length; i++ ) {
		if( fw[i].playerId == playerId2 ) {
			player2Position = "fw";
			player2PosIndex = i;
			player2 = fw[i];
		}
	}

	if( sub_gk.playerId == playerId2 ) {
		player2Position = "sub_gk";
		player2PosIndex = 0;
		player2 = sub_gk;
	}

	for( i = 0; i < sub_other.length; i++ ) {
		if( sub_other[i].playerId == playerId2 ) {
			player2Position = "sub";
			player2PosIndex = i;
			player2 = sub_other[i];
		}
	}

	/* Swap */
	if( player1.position == "gk" ) {
		if( player1Position == "gk" ) {
			gk = player2;
			sub_gk = player1;
		}
		else {
			gk = player1;
			sub_gk = player2;
		}
	}
	else if( player1.position == player2.position ) {
		if( player1Position == "df" ) {
			sub_other[player2PosIndex] = player1;
			df[player1PosIndex] = player2;
		}
		else if( player1Position == "md" ) {
			sub_other[player2PosIndex] = player1;
			md[player1PosIndex] = player2;
		}
		else if( player1Position == "fw" ) {
			sub_other[player2PosIndex] = player1;
			fw[player1PosIndex] = player2;
		}
		else if( player1Position == "sub" && player1.position == "df" ) {
			sub_other[player1PosIndex] = player2;
			df[player2PosIndex] = player1;
		}
		else if( player1Position == "sub" && player1.position == "md" ) {
			sub_other[player1PosIndex] = player2;
			md[player2PosIndex] = player1;
		}
		else if( player1Position == "sub" && player1.position == "fw" ) {
			sub_other[player1PosIndex] = player2;
			fw[player2PosIndex] = player1;
		}
	}
	else {
		if( player1Position == "df" )
			df.splice(player1PosIndex, 1);
		else if( player1Position == "md" )
			md.splice(player1PosIndex, 1);
		else if( player1Position == "fw" )
			fw.splice(player1PosIndex, 1);
		else if( player2Position == "df" )
			df.splice(player2PosIndex, 1);
		else if( player2Position == "md" )
			md.splice(player2PosIndex, 1);
		else if( player2Position == "fw" )
			fw.splice(player2PosIndex, 1);

		if( player1Position == "sub" && player1.position == "df" ) {
			df.push(player1);
			sub_other[player1PosIndex] = player2;
		}
		else if( player1Position == "sub" && player1.position == "md" ) {
			md.push(player1);
			sub_other[player1PosIndex] = player2;
		}
		else if( player1Position == "sub" && player1.position == "fw" ) {
			fw.push(player1);
			sub_other[player1PosIndex] = player2;
		}
		else if( player2Position == "sub" && player2.position == "df" ) {
			df.push(player2);
			sub_other[player2PosIndex] = player1;
		}
		else if( player2Position == "sub" && player2.position == "md" ) {
			md.push(player2);
			sub_other[player2PosIndex] = player1;
		}
		else if( player2Position == "sub" && player2.position == "fw" ) {
			fw.push(player2);
			sub_other[player2PosIndex] = player1;
		}
	}

	setSquad();
	$('#table_gk td, #table_df td, #table_md td, #table_fw td, #table_sub td').css("border", "2px solid rgba(0, 0, 0, 0)");
}

</script>

<!-- SCRIPT for setting captain -->
<script>

function onclickSetCaptain() {

	playerId = choosingPlayerId;
	gk.captain = false;
	for(i = 0; i < df.length; i++)
		df[i].captain = false;
	for(i = 0; i < md.length; i++)
		md[i].captain = false;
	for(i = 0; i < fw.length; i++)
		fw[i].captain = false;

	if( gk.playerId == playerId )
		gk.captain = true;
	for(i = 0; i < df.length; i++) {
		if( df[i].playerId == playerId )
			df[i].captain = true;
	}
	for(i = 0; i < md.length; i++) {
		if( md[i].playerId == playerId )
			md[i].captain = true;
	}
	for(i = 0; i < fw.length; i++) {
		if( fw[i].playerId == playerId )
			fw[i].captain = true;
	}

	$('#table_gk td, #table_df td, #table_md td, #table_fw td, #table_sub td').css("border", "2px solid rgba(0, 0, 0, 0)");
	isChoosingPlayer = false;
	$('#btn_save').show();
	$('#btn_cancel_move').hide();
	$('#btn_captain').hide();
	$('#btn_player_info').hide();
	setSquad();
}

</script>

<!-- SCRIPT for saving -->
<script>

function getCommaStringPlayer() {
	aPlayerId = [];
	
	aPlayerId.push( $('#table_gk td').attr('data-playerId') );
	
	for( i = 0; i < $('#table_df td').length; i++ )
		aPlayerId.push( $('#table_df td').eq(i).attr('data-playerId') );

	for( i = 0; i < $('#table_md td').length; i++ )
		aPlayerId.push( $('#table_md td').eq(i).attr('data-playerId') );

	for( i = 0; i < $('#table_fw td').length; i++ )
		aPlayerId.push( $('#table_fw td').eq(i).attr('data-playerId') );

	for( i = 1; i < $('#table_sub td').length; i++ )
		aPlayerId.push( $('#table_sub td').eq(i).attr('data-playerId') );

	return aPlayerId.join();
}

function getCaptainIndex() {
	i = 0;
	if( $('#table_gk td .cell_player_captain').length == 1 )
		return i;
	i++;
	
	for( j = 0; j < $('#table_df td').length; j++ ) {
		if( $('#table_df td:eq('+j+') .cell_player_captain').length == 1 )
			return i;
		i++;
	}

	for( j = 0; j < $('#table_md td').length; j++ ) {
		if( $('#table_md td:eq('+j+') .cell_player_captain').length == 1 )
			return i;
		i++;
	}

	for( j = 0; j < $('#table_fw td').length; j++ ) {
		if( $('#table_fw td:eq('+j+') .cell_player_captain').length == 1 )
			return i;
		i++;
	}
}

function onclickSave() {
	$('#div_loading_2').show();
	$.ajax({
		url: "?r=PickTeam/SaveMyXI",
		data: {
			playerIds: getCommaStringPlayer(),
			captain_index: getCaptainIndex(),
		},
		type: 'POST',
		success: function(data){
			$('#div_loading_2').hide();
			if( data == 1 )
				showModal("สำเร็จ", "บันทึกผู้เล่นสำเร็จ", false);
			else
				showModal("มีข้อผิดพลาด", "พบข้อผิดพลาด โปรดลองอีกครั้ง", false);
		},
		error: function(){
			showModal("มีข้อผิดพลาด", "พบข้อผิดพลาด โปรดลองอีกครั้ง", false);
			$('#div_loading_2').hide();
		},
				        
	});
}



</script>