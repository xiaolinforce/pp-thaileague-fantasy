
<style>

#div_pickteam_cover {
	text-align: center;
	background-image: url('images/pitch.png'); 
	background-repeat: no-repeat; 
	background-position: center;
	background-size: contain;
}

.cell_player {
	padding: 6px; 
	cursor: pointer;
}

.cell_player_teambg {
	width: 100px; 
	height: 50px;
	border-radius: 10px 10px 0 0;
}

.cell_player_player {
	width: 100px;
	/*opacity: 0.9*/
}

.cell_player_team {
	width: 100px;
	/*opacity: 0.9; */
	border-radius: 0 0 10px 10px;
}

</style>

<div id="div_pickteam_cover">
	<table id="table_gk" style="display: inline; border-collapse: separate;">
		<tr>
			<td data-playerId="1" data-teamId="1" data-position="gk" data-canChange="1" class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
				<div class="cell_player_teambg" style="background-image: url('images/team_background_squad/muang_thong.png'); background-size: contain;"></div>
				<div class="cell_player_player" style="background-color: #FFDBDC; color: #b31f24;">กวิน</div>
				<div class="cell_player_team" style="background-color: #b31f24; color: #FFDBDC;">เมืองทอง</div>
			</td>
		</tr>
	</table>
	<br>
	
	<table id="table_df" style="display: inline; border-collapse: separate;">
		<tr>
			<td data-playerId="1" data-teamId="1" data-position="df" data-canChange="1" class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
				<div class="cell_player_teambg" style="background-image: url('images/team_background_squad/muang_thong.png'); background-size: contain;"></div>
				<div class="cell_player_player" style="background-color: #E1DFF7; color: #04003E;">Túñez</div>
				<div class="cell_player_team" style="background-color: #04003E; color: #E1DFF7;">บุรีรัมย์</div>
			</td>
		</tr>
	</table>
	<br>
	
	<table id="table_md" style="display: inline; border-collapse: separate;">
		<tr>
			<td data-playerId="1" data-teamId="1" data-position="md" data-canChange="1" class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
				<div class="cell_player_teambg" style="background-image: url('images/team_background_squad/muang_thong.png'); background-size: contain;"></div>
				<div class="cell_player_player" style="background-color: #FFDBDC; color: #b31f24;">Sho Shimoji</div>
				<div class="cell_player_team" style="background-color: #b31f24; color: #FFDBDC;">ชัยนาท</div>
			</td>
		</tr>
	</table>
	<br>
	
	<table id="table_fw" style="display: inline; border-collapse: separate;">
		<tr>
			<td data-playerId="1" data-teamId="1" data-position="fw" data-canChange="1" class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
				<div class="cell_player_teambg" style="background-image: url('images/team_background_squad/muang_thong.png'); background-size: contain;"></div>
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
				<div class="cell_player_teambg" style="background-image: url('images/team_background_squad/muang_thong.png'); background-size: contain;"></div>
				<div class="cell_player_player" style="background-color: #FFDBDC; color: #b31f24;">Hart</div>
				<div class="cell_player_team" style="background-color: #b31f24; color: #FFDBDC;">Torino</div>
			</td>
			<td data-playerId="1" data-teamId="1" data-position="fw" data-canChange="1" class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
				<div class="cell_player_teambg" style="background-image: url('images/team_background_squad/muang_thong.png'); background-size: contain;"></div>
				<div class="cell_player_player" style="background-color: #FFDBDC; color: #b31f24;">Yannick</div>
				<div class="cell_player_team" style="background-color: #b31f24; color: #FFDBDC;">ราชบุรี</div>
			</td>
			<td data-playerId="1" data-teamId="1" data-position="md" data-canChange="1" class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
				<div class="cell_player_teambg" style="background-image: url('images/team_background_squad/muang_thong.png'); background-size: contain;"></div>
				<div class="cell_player_player" style="background-color: #FFDBDC; color: #b31f24;">Yannick</div>
				<div class="cell_player_team" style="background-color: #b31f24; color: #FFDBDC;">ราชบุรี</div>
			</td>
			<td data-playerId="1" data-teamId="1" data-position="df" data-canChange="1" class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
				<div class="cell_player_teambg" style="background-image: url('images/team_background_squad/muang_thong.png'); background-size: contain;"></div>
				<div class="cell_player_player" style="background-color: #FFDBDC; color: #b31f24;">Yannick</div>
				<div class="cell_player_team" style="background-color: #b31f24; color: #FFDBDC;">ราชบุรี</div>
			</td>
		</tr>
	</table>
</div>

<button id="btn_save" type="button" class="btn btn-success btn-lg" style="position: fixed; bottom: 10px; right: 10px;">บันทึกการจัดตัว</button>
<button id="btn_cancel_move" type="button" class="btn btn-warning btn-lg" style="position: fixed; bottom: 10px; left: 10px; display: none;" onclick="onclickCancelMove()">ยกเลิก</button>

<div style="display: none;">
	<table id="temp_table_player" style="display: inline;">
		<tr>
			<td data-playerId="1" data-teamId="1" data-position="gk" data-canChange="1" class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
				<div class="cell_player_teambg" style="background-image: url('images/team_background_squad/muang_thong.png'); background-size: contain;"></div>
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
	initSetting();
	setSquad();
	onclickPlayer();
});

function initSetting() {
	gk = {
		teamBg: "images/team_background_squad/ratchaburi.png", 
		colorLight: "#FFEDD6",
		colorDark: "#F47920",
		playerId: 1,
		playerName: "อุกฤษณ์",
		teamId: 1,
		teamName: "ราชบุรี",
		position: "gk"
	};

	df = [];
	df.push({
		teamBg: "images/team_background_squad/buriram.png", 
		colorLight: "#E1DFF7",
		colorDark: "#04003E",
		playerId: 2,
		playerName: "กรวิทย์",
		teamId: 1,
		teamName: "บุรีรัมย์",
		position: "df"
	});
	df.push({
		teamBg: "images/team_background_squad/sukhothai.png", 
		colorLight: "#FFD3D2",
		colorDark: "#D41714",
		playerId: 3,
		playerName: "ปิยวัชร์",
		teamId: 1,
		teamName: "สุโขทัย",
		position: "df"
	});
	df.push({
		teamBg: "images/team_background_squad/bangkok_utd.png", 
		colorLight: "#D3D1FF",
		colorDark: "#262366",
		playerId: 4,
		playerName: "มิก้า",
		teamId: 1,
		teamName: "แบงคอก",
		position: "df"
	});
	df.push({
		teamBg: "images/team_background_squad/muang_thong.png", 
		colorLight: "#FFDBDC",
		colorDark: "#b31f24",
		playerId: 5,
		playerName: "โด",
		teamId: 1,
		teamName: "เมืองทอง",
		position: "df"
	});

	md = [];
	md.push({
		teamBg: "images/team_background_squad/muang_thong.png", 
		colorLight: "#FFDBDC",
		colorDark: "#b31f24",
		playerId: 6,
		playerName: "ชนาธิป",
		teamId: 1,
		teamName: "เมืองทอง",
		position: "md"
	});
	md.push({
		teamBg: "images/team_background_squad/muang_thong.png", 
		colorLight: "#FFDBDC",
		colorDark: "#b31f24",
		playerId: 7,
		playerName: "สารัช",
		teamId: 1,
		teamName: "เมืองทอง",
		position: "md"
	});
	md.push({
		teamBg: "images/team_background_squad/muang_thong.png", 
		colorLight: "#FFDBDC",
		colorDark: "#b31f24",
		playerId: 8,
		playerName: "อาโอยาม่า",
		teamId: 1,
		teamName: "เมืองทอง",
		position: "md"
	});

	fw = [];
	fw.push({
		teamBg: "images/team_background_squad/muang_thong.png", 
		colorLight: "#FFDBDC",
		colorDark: "#b31f24",
		playerId: 9,
		playerName: "ธีรศิลป์",
		teamId: 1,
		teamName: "เมืองทอง",
		position: "md"
	});
	fw.push({
		teamBg: "images/team_background_squad/muang_thong.png", 
		colorLight: "#FFDBDC",
		colorDark: "#b31f24",
		playerId: 10,
		playerName: "กวิน",
		teamId: 1,
		teamName: "คลีตัน",
		position: "fw"
	});
	fw.push({
		teamBg: "images/team_background_squad/muang_thong.png", 
		colorLight: "#FFDBDC",
		colorDark: "#b31f24",
		playerId: 11,
		playerName: "เอนดริ",
		teamId: 1,
		teamName: "เมืองทอง",
		position: "fw"
	});

	sub_gk = {
		teamBg: "images/team_background_squad/muang_thong.png", 
		colorLight: "#FFDBDC",
		colorDark: "#b31f24",
		playerId: 12,
		playerName: "วิศณุศักดิ์",
		teamId: 1,
		teamName: "เมืองทอง",
		position: "gk"
	};

	sub_other = [];
	sub_other.push({
		teamBg: "images/team_background_squad/muang_thong.png", 
		colorLight: "#FFDBDC",
		colorDark: "#b31f24",
		playerId: 13,
		playerName: "อาทิตย์",
		teamId: 1,
		teamName: "เมืองทอง",
		position: "df"
	});
	sub_other.push({
		teamBg: "images/team_background_squad/muang_thong.png", 
		colorLight: "#FFDBDC",
		colorDark: "#b31f24",
		playerId: 14,
		playerName: "ดัสกร",
		teamId: 1,
		teamName: "เมืองทอง",
		position: "md"
	});
	sub_other.push({
		teamBg: "images/team_background_squad/muang_thong.png", 
		colorLight: "#FFDBDC",
		colorDark: "#b31f24",
		playerId: 15,
		playerName: "อินเนียสตา",
		teamId: 1,
		teamName: "เมืองทอง",
		position: "md"
	});
}

function setSquad() {
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
			}
		}
		else {
			choosingPlayerId = $(this).attr("data-playerId");
			choosingPosition = $(this).attr("data-position");
			isChoosingPlayer = true;
			$('#table_sub td:eq(1)').attr("data-canChange", "1");
			$('#table_df td, #table_md td, #table_fw td, #table_sub td:eq(2), #table_sub td:eq(3), #table_sub td:eq(4)').attr("data-canChange", "0");
			$('#table_df td, #table_md td, #table_fw td, #table_sub td:eq(2), #table_sub td:eq(3), #table_sub td:eq(4)').css("border", "2px solid #FF4040");
			$('#table_sub td:eq(1)').css("border", "2px solid #64FF41");
			$('#btn_save').hide();
			$('#btn_cancel_move').show();
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
			}
		}
		else {
			choosingPlayerId = $(this).attr("data-playerId");
			choosingPosition = $(this).attr("data-position");
			isChoosingPlayer = true;
			$('#table_sub td:eq(2), #table_sub td:eq(3), #table_sub td:eq(4)').attr("data-canChange", "1");
			$('#table_gf td, #table_md td, #table_fw td, #table_sub td:eq(1)').attr("data-canChange", "0");
			$('#table_gf td, #table_md td, #table_fw td, #table_sub td:eq(1)').css("border", "2px solid #FF4040");
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
			
			$('#btn_save').hide();
			$('#btn_cancel_move').show();
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
			}
		}
		else {
			choosingPlayerId = $(this).attr("data-playerId");
			choosingPosition = $(this).attr("data-position");
			isChoosingPlayer = true;
			$('#table_sub td:eq(2), #table_sub td:eq(3), #table_sub td:eq(4)').attr("data-canChange", "1");
			$('#table_gf td, #table_df td, #table_fw td, #table_sub td:eq(1)').attr("data-canChange", "0");
			$('#table_gf td, #table_df td, #table_fw td, #table_sub td:eq(1)').css("border", "2px solid #FF4040");
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
			
			$('#btn_save').hide();
			$('#btn_cancel_move').show();
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
			}
		}
		else {
			choosingPlayerId = $(this).attr("data-playerId");
			choosingPosition = $(this).attr("data-position");
			isChoosingPlayer = true;
			$('#table_sub td:eq(2), #table_sub td:eq(3), #table_sub td:eq(4)').attr("data-canChange", "1");
			$('#table_gf td, #table_df td, #table_fw td, #table_sub td:eq(1)').attr("data-canChange", "0");
			$('#table_gf td, #table_df td, #table_fw td, #table_sub td:eq(1)').css("border", "2px solid #FF4040");
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
			
			$('#btn_save').hide();
			$('#btn_cancel_move').show();
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
			}
		}
		else {
			choosingPlayerId = $(this).attr("data-playerId");
			choosingPosition = $(this).attr("data-position");
			isChoosingPlayer = true;
			$('#table_gk td').attr("data-canChange", "1");
			$('#table_df td, #table_md td, #table_fw td, #table_sub td:eq(2), #table_sub td:eq(3), #table_sub td:eq(4)').attr("data-canChange", "0");
			$('#table_df td, #table_md td, #table_fw td, #table_sub td:eq(2), #table_sub td:eq(3), #table_sub td:eq(4)').css("border", "2px solid #FF4040");
			$('#table_gk td').css("border", "2px solid #64FF41");
			$('#btn_save').hide();
			$('#btn_cancel_move').show();
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
			}
		}
		else {
			choosingPlayerId = $(this).attr("data-playerId");
			choosingPosition = $(this).attr("data-position");
			isChoosingPlayer = true;
			$('#table_df td, #table_md td, #table_fw td').attr("data-canChange", "1");
			$('#table_gk td').attr("data-canChange", "0");
			$('#table_df td, #table_md td, #table_fw td').css("border", "2px solid #64FF41");
			$('#table_gk td').css("border", "2px solid #FF4040");

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
			
			$('#btn_save').hide();
			$('#btn_cancel_move').show();
		}
	});
}

function onclickCancelMove() {
	isChoosingPlayer = false;
	$('#table_gk td, #table_df td, #table_md td, #table_fw td, #table_sub td').css("border", "2px solid rgba(0, 0, 0, 0)");
	$('#btn_save').show();
	$('#btn_cancel_move').hide();
}

</script>

<!-- SCRIPT for swapping player -->
<script>

function swapPlayer(playerId1, playerId2, canSwap) {

	if(!canSwap) {
		alert('ไม่สามารถเปลี่ยนตัวได้');
		return;
	}
	
	/* Get Player 1 Detail */
	if( gk.playerId == playerId1 ) {
		player1Position = "gk";
		player1PosIndex = 0;
		player1 = {
			teamBg: gk.teamBg, 
			colorLight: gk.colorLight,
			colorDark: gk.colorDark,
			playerId: gk.playerId,
			playerName: gk.playerName,
			teamId: gk.teamId,
			teamName: gk.teamName,
			position: gk.position
		};
	}

	for( i = 0; i < df.length; i++ ) {
		if( df[i].playerId == playerId1 ) {
			player1Position = "df";
			player1PosIndex = i;
			player1 = {
				teamBg: df[i].teamBg, 
				colorLight: df[i].colorLight,
				colorDark: df[i].colorDark,
				playerId: df[i].playerId,
				playerName: df[i].playerName,
				teamId: df[i].teamId,
				teamName: df[i].teamName,
				position: df[i].position
			};
		}
	}

	for( i = 0; i < md.length; i++ ) {
		if( md[i].playerId == playerId1 ) {
			player1Position = "md";
			player1PosIndex = i;
			player1 = {
				teamBg: md[i].teamBg, 
				colorLight: md[i].colorLight,
				colorDark: md[i].colorDark,
				playerId: md[i].playerId,
				playerName: md[i].playerName,
				teamId: md[i].teamId,
				teamName: md[i].teamName,
				position: md[i].position
			};
		}
	}

	for( i = 0; i < fw.length; i++ ) {
		if( fw[i].playerId == playerId1 ) {
			player1Position = "fw";
			player1PosIndex = i;
			player1 = {
				teamBg: fw[i].teamBg, 
				colorLight: fw[i].colorLight,
				colorDark: fw[i].colorDark,
				playerId: fw[i].playerId,
				playerName: fw[i].playerName,
				teamId: fw[i].teamId,
				teamName: fw[i].teamName,
				position: fw[i].position
			};
		}
	}

	if( sub_gk.playerId == playerId1 ) {
		player1Position = "sub_gk";
		player1PosIndex = 0;
		player1 = {
			teamBg: sub_gk.teamBg, 
			colorLight: sub_gk.colorLight,
			colorDark: sub_gk.colorDark,
			playerId: sub_gk.playerId,
			playerName: sub_gk.playerName,
			teamId: sub_gk.teamId,
			teamName: sub_gk.teamName,
			position: sub_gk.position
		};
	}

	for( i = 0; i < sub_other.length; i++ ) {
		if( sub_other[i].playerId == playerId1 ) {
			player1Position = "sub";
			player1PosIndex = i;
			player1 = {
				teamBg: sub_other[i].teamBg, 
				colorLight: sub_other[i].colorLight,
				colorDark: sub_other[i].colorDark,
				playerId: sub_other[i].playerId,
				playerName: sub_other[i].playerName,
				teamId: sub_other[i].teamId,
				teamName: sub_other[i].teamName,
				position: sub_other[i].position
			};
		}
	}

	/* Get Player 2 Detail */
	if( gk.playerId == playerId2 ) {
		player2Position = "gk";
		player2PosIndex = 0;
		player2 = {
			teamBg: gk.teamBg, 
			colorLight: gk.colorLight,
			colorDark: gk.colorDark,
			playerId: gk.playerId,
			playerName: gk.playerName,
			teamId: gk.teamId,
			teamName: gk.teamName,
			position: gk.position
		};
	}

	for( i = 0; i < df.length; i++ ) {
		if( df[i].playerId == playerId2 ) {
			player2Position = "df";
			player2PosIndex = i;
			player2 = {
				teamBg: df[i].teamBg, 
				colorLight: df[i].colorLight,
				colorDark: df[i].colorDark,
				playerId: df[i].playerId,
				playerName: df[i].playerName,
				teamId: df[i].teamId,
				teamName: df[i].teamName,
				position: df[i].position
			};
		}
	}

	for( i = 0; i < md.length; i++ ) {
		if( md[i].playerId == playerId2 ) {
			player2Position = "md";
			player2PosIndex = i;
			player2 = {
				teamBg: md[i].teamBg, 
				colorLight: md[i].colorLight,
				colorDark: md[i].colorDark,
				playerId: md[i].playerId,
				playerName: md[i].playerName,
				teamId: md[i].teamId,
				teamName: md[i].teamName,
				position: md[i].position
			};
		}
	}

	for( i = 0; i < fw.length; i++ ) {
		if( fw[i].playerId == playerId2 ) {
			player2Position = "fw";
			player2PosIndex = i;
			player2 = {
				teamBg: fw[i].teamBg, 
				colorLight: fw[i].colorLight,
				colorDark: fw[i].colorDark,
				playerId: fw[i].playerId,
				playerName: fw[i].playerName,
				teamId: fw[i].teamId,
				teamName: fw[i].teamName,
				position: fw[i].position
			};
		}
	}

	if( sub_gk.playerId == playerId2 ) {
		player2Position = "sub_gk";
		player2PosIndex = 0;
		player2 = {
			teamBg: sub_gk.teamBg, 
			colorLight: sub_gk.colorLight,
			colorDark: sub_gk.colorDark,
			playerId: sub_gk.playerId,
			playerName: sub_gk.playerName,
			teamId: sub_gk.teamId,
			teamName: sub_gk.teamName,
			position: sub_gk.position
		};
	}

	for( i = 0; i < sub_other.length; i++ ) {
		if( sub_other[i].playerId == playerId2 ) {
			player2Position = "sub";
			player2PosIndex = i;
			player2 = {
				teamBg: sub_other[i].teamBg, 
				colorLight: sub_other[i].colorLight,
				colorDark: sub_other[i].colorDark,
				playerId: sub_other[i].playerId,
				playerName: sub_other[i].playerName,
				teamId: sub_other[i].teamId,
				teamName: sub_other[i].teamName,
				position: sub_other[i].position
			};
		}
	}

	/* Delete Player 1 and Player 2 from Array */
	/*if( player1Position == "df" )
		df.splice(player1PosIndex, 1);
	if( player1Position == "md" )
		md.splice(player1PosIndex, 1);
	if( player1Position == "fw" )
		fw.splice(player1PosIndex, 1);
	if( player1Position == "sub" )
		sub_other.splice(player1PosIndex, 1);
	if( player2Position == "df" )
		df.splice(player2PosIndex, 1);
	if( player2Position == "md" )
		md.splice(player2PosIndex, 1);
	if( player2Position == "fw" )
		fw.splice(player2PosIndex, 1);
	if( player2Position == "sub" )
		sub_other.splice(player2PosIndex, 1);*/

	/* Swap */
	if( player1.position == "gk" ) {
		if( player1Position = "gk" ) {
			gk = player2;
			sub_gk = player1;
		}
		else {
			gk = player1;
			sub_gk = player2;
		}
	}
	else if( player1.position == player2.position ) {
		if( player1Position = "df" ) {
		}
	}

	

	setSquad();
	$('#table_gk td').css("border", "2px solid rgba(0, 0, 0, 0)");
	$('#table_df td').css("border", "2px solid rgba(0, 0, 0, 0)");
	$('#table_md td').css("border", "2px solid rgba(0, 0, 0, 0)");
	$('#table_fw td').css("border", "2px solid rgba(0, 0, 0, 0)");
	$('#table_sub td').css("border", "2px solid rgba(0, 0, 0, 0)");
}

</script>