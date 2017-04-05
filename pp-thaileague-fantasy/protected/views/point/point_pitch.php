
<?php 
	/*
	 * INPUTS:
	 * 
	 * $aPlayerGk[detail], $aPlayerDf[index][detail], $aPlayerMd[index][detail], $aPlayerFw[index][detail],
	 * $aPlayerGkSub[detail], $aPlayerSub[index][detail]
	 * 		detail: team_bg, color_light, color_dark, player_name, point, is_captain, message
	 * 
	 * */
?>

<style>

#div_point_cover {
	text-align: center;
	background-image: url('images/pitch.png'); 
	background-repeat: no-repeat; 
	background-position: center;
	background-size: contain;
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

</style>

<div id="div_point_cover">

	<table id="table_gk" style="display: inline; border-collapse: separate;">
		<tr>
			<td class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
				<div class="cell_player_teambg" style="background-image: url('images/team_background_squad/muang_thong.png'); background-size: cover;"></div>
				<div class="cell_player_player" style="background-color: #FFDBDC; color: #b31f24;">กวิน</div>
				<div class="cell_player_team" style="background-color: #b31f24; color: #FFDBDC;">6</div>
			</td>
		</tr>
	</table>
	<br>
	
	<table id="table_df" style="display: inline; border-collapse: separate;">
		<tr>
			<td class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
				<div class="cell_player_teambg" style="background-image: url('images/team_background_squad/muang_thong.png'); background-size: cover;"></div>
				<div class="cell_player_player" style="background-color: #E1DFF7; color: #04003E;">Túñez</div>
				<div class="cell_player_team" style="background-color: #04003E; color: #E1DFF7;">1</div>
			</td>
		</tr>
	</table>
	<br>
	
	<table id="table_md" style="display: inline; border-collapse: separate;">
		<tr>
			<td class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
				<div class="cell_player_teambg" style="background-image: url('images/team_background_squad/muang_thong.png'); background-size: cover;"></div>
				<div class="cell_player_player" style="background-color: #E1DFF7; color: #04003E;">Túñez</div>
				<div class="cell_player_team" style="background-color: #04003E; color: #E1DFF7;">-2</div>
			</td>
		</tr>
	</table>
	<br>
	
	<table id="table_fw" style="display: inline; border-collapse: separate;">
		<tr>
			<td class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
				<div class="cell_player_teambg" style="background-image: url('images/team_background_squad/muang_thong.png'); background-size: cover;"></div>
				<div class="cell_player_player" style="background-color: #E1DFF7; color: #04003E;">Túñez</div>
				<div class="cell_player_team" style="background-color: #04003E; color: #E1DFF7;">20</div>
			</td>
		</tr>
	</table>
	<br>

</div>

<div style="text-align: center; margin-top: 10px;">
	<table id="table_sub" style="display: inline; border-collapse: separate;">
		<tr>
			<td style="color: #b31f24; font-weight: bold; font-size: 20px; padding-right: 10px;">ตัวสำรอง :</td>
			<td class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
				<div class="cell_player_teambg" style="background-image: url('images/team_background_squad/muang_thong.png'); background-size: cover;"></div>
				<div class="cell_player_player" style="background-color: #FFDBDC; color: #b31f24;">Hart</div>
				<div class="cell_player_team" style="background-color: #b31f24; color: #FFDBDC;">0</div>
			</td>
			<td class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
				<div class="cell_player_teambg" style="background-image: url('images/team_background_squad/muang_thong.png'); background-size: cover;"></div>
				<div class="cell_player_player" style="background-color: #FFDBDC; color: #b31f24;">Yannick</div>
				<div class="cell_player_team" style="background-color: #b31f24; color: #FFDBDC;">0</div>
			</td>
			<td class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
				<div class="cell_player_teambg" style="background-image: url('images/team_background_squad/muang_thong.png'); background-size: cover;"></div>
				<div class="cell_player_player" style="background-color: #FFDBDC; color: #b31f24;">Yannick</div>
				<div class="cell_player_team" style="background-color: #b31f24; color: #FFDBDC;">2</div>
			</td>
			<td class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
				<div class="cell_player_teambg" style="background-image: url('images/team_background_squad/muang_thong.png'); background-size: cover;"></div>
				<div class="cell_player_player" style="background-color: #FFDBDC; color: #b31f24;">Yannick</div>
				<div class="cell_player_team" style="background-color: #b31f24; color: #FFDBDC;">27</div>
			</td>
		</tr>
	</table>
</div>

<table id="temp_table_player" style="display: inline; display: none;">
	<tr>
		<td class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
			<div class="cell_player_teambg" style="background-image: url('images/team_background_squad/muang_thong.png'); background-size: cover;"></div>
			<div class="cell_player_player" style="background-color: #FFDBDC; color: #b31f24;">Túñez</div>
			<div class="cell_player_team" style="background-color: #b31f24; color: #FFDBDC;">บุรีรัมย์</div>
		</td>
	</tr>
</table>

<script>

var totalWeekPoint;

$(document).ready(function(){
	setting();
});

function setting() {

	totalWeekPoint = 0;
	
	gk = {
		teamBg: "<?= $aPlayerGk['team_bg'] ?>", 
		colorLight: "<?= $aPlayerGk['color_light'] ?>",
		colorDark: "<?= $aPlayerGk['color_dark'] ?>",
		playerName: "<?= $aPlayerGk['player_name'] ?>",
		point: <?= $aPlayerGk['point'] ?>,
		captain: <?= $aPlayerGk['is_captain'] ? 'true' : 'false' ?>,
		message: "<?= $aPlayerGk['message'] ?>"
	};
	totalWeekPoint += gk.point;

	df = [];
	<?php 
		foreach( $aPlayerDf as $aEachPlayer ) {
	?>
		df.push({
			teamBg: "<?= $aEachPlayer['team_bg'] ?>", 
			colorLight: "<?= $aEachPlayer['color_light'] ?>",
			colorDark: "<?= $aEachPlayer['color_dark'] ?>",
			playerName: "<?= $aEachPlayer['player_name'] ?>",
			point: <?= $aEachPlayer['point'] ?>,
			captain: <?= $aEachPlayer['is_captain'] ? 'true' : 'false' ?>,
			message: "<?= $aEachPlayer['message'] ?>"
		});
		totalWeekPoint += <?= $aEachPlayer['point'] ?>;
	<?php 
		}
	?>

	md = [];
	<?php 
		foreach( $aPlayerMd as $aEachPlayer ) {
	?>
		md.push({
			teamBg: "<?= $aEachPlayer['team_bg'] ?>", 
			colorLight: "<?= $aEachPlayer['color_light'] ?>",
			colorDark: "<?= $aEachPlayer['color_dark'] ?>",
			playerName: "<?= $aEachPlayer['player_name'] ?>",
			point: <?= $aEachPlayer['point'] ?>,
			captain: <?= $aEachPlayer['is_captain'] ? 'true' : 'false' ?>,
			message: "<?= $aEachPlayer['message'] ?>"
		});
		totalWeekPoint += <?= $aEachPlayer['point'] ?>;
	<?php 
		}
	?>

	fw = [];
	<?php 
		foreach( $aPlayerFw as $aEachPlayer ) {
	?>
		fw.push({
			teamBg: "<?= $aEachPlayer['team_bg'] ?>", 
			colorLight: "<?= $aEachPlayer['color_light'] ?>",
			colorDark: "<?= $aEachPlayer['color_dark'] ?>",
			playerName: "<?= $aEachPlayer['player_name'] ?>",
			point: <?= $aEachPlayer['point'] ?>,
			captain: <?= $aEachPlayer['is_captain'] ? 'true' : 'false' ?>,
			message: "<?= $aEachPlayer['message'] ?>"
		});
		totalWeekPoint += <?= $aEachPlayer['point'] ?>;
	<?php 
		}
	?>

	sub_gk = {
		teamBg: "<?= $aPlayerGkSub['team_bg'] ?>", 
		colorLight: "<?= $aPlayerGkSub['color_light'] ?>",
		colorDark: "<?= $aPlayerGkSub['color_dark'] ?>",
		playerName: "<?= $aPlayerGkSub['player_name'] ?>",
		point: <?= $aPlayerGkSub['point'] ?>,
		captain: <?= $aPlayerGkSub['is_captain'] ? 'true' : 'false' ?>,
		message: "<?= $aPlayerGkSub['message'] ?>"
	};

	sub_other = [];
	<?php 
		foreach( $aPlayerSub as $aEachPlayer ) {
	?>
		sub_other.push({
			teamBg: "<?= $aEachPlayer['team_bg'] ?>", 
			colorLight: "<?= $aEachPlayer['color_light'] ?>",
			colorDark: "<?= $aEachPlayer['color_dark'] ?>",
			playerName: "<?= $aEachPlayer['player_name'] ?>",
			point: <?= $aEachPlayer['point'] ?>,
			captain: <?= $aEachPlayer['is_captain'] ? 'true' : 'false' ?>,
			message: "<?= $aEachPlayer['message'] ?>"
		});
	<?php 
		}
	?>

	$('#table_gk div:eq(0)').css("background-image", "url('images/" + gk.teamBg + "')");
	$('#table_gk div:eq(1)').css("background-color", "#"+gk.colorLight);
	$('#table_gk div:eq(1)').css("color", "#"+gk.colorDark);
	$('#table_gk div:eq(1)').html(gk.playerName);
	$('#table_gk div:eq(2)').css("background-color", "#"+gk.colorDark);
	$('#table_gk div:eq(2)').css("color", "#"+gk.colorLight);
	$('#table_gk div:eq(2)').html(gk.point);
	$('#table_gk td').attr("onclick", "showModal('รายละเอียดของแต้มที่ได้: " + gk.playerName + "', '" + gk.message + "', false);");
	if( gk.captain )	$('#table_gk td').append('<div class="cell_player_captain">C</div>');
	
	html = "";
	for(i = 0; i < df.length; i++) {
		$('#temp_table_player div:eq(0)').css("background-image", "url('images/" + df[i].teamBg + "')");
		$('#temp_table_player div:eq(1)').css("background-color", "#"+df[i].colorLight);
		$('#temp_table_player div:eq(1)').css("color", "#"+df[i].colorDark);
		$('#temp_table_player div:eq(1)').html(df[i].playerName);
		$('#temp_table_player div:eq(2)').css("background-color", "#"+df[i].colorDark);
		$('#temp_table_player div:eq(2)').css("color", "#"+df[i].colorLight);
		$('#temp_table_player div:eq(2)').html(df[i].point);
		$('#temp_table_player td').attr("onclick", "showModal('รายละเอียดของแต้มที่ได้: " + df[i].playerName + "', '" + df[i].message + "', false);");
		$('#temp_table_player td .cell_player_captain').remove();
		if( df[i].captain )	$('#temp_table_player td').append('<div class="cell_player_captain">C</div>');

		html = html + $('#temp_table_player tr').html();
	}
	$('#table_df tr').html(html);

	html = "";
	for(i = 0; i < md.length; i++) {
		$('#temp_table_player div:eq(0)').css("background-image", "url('images/" + md[i].teamBg + "')");
		$('#temp_table_player div:eq(1)').css("background-color", "#"+md[i].colorLight);
		$('#temp_table_player div:eq(1)').css("color", "#"+md[i].colorDark);
		$('#temp_table_player div:eq(1)').html(md[i].playerName);
		$('#temp_table_player div:eq(2)').css("background-color", "#"+md[i].colorDark);
		$('#temp_table_player div:eq(2)').css("color", "#"+md[i].colorLight);
		$('#temp_table_player div:eq(2)').html(md[i].point);
		$('#temp_table_player td').attr("onclick", "showModal('รายละเอียดของแต้มที่ได้: " + md[i].playerName + "', '" + md[i].message + "', false);");
		$('#temp_table_player td .cell_player_captain').remove();
		if( md[i].captain )	$('#temp_table_player td').append('<div class="cell_player_captain">C</div>');
		html = html + $('#temp_table_player tr').html();
	}
	$('#table_md tr').html(html);

	html = "";
	for(i = 0; i < fw.length; i++) {
		$('#temp_table_player div:eq(0)').css("background-image", "url('images/" + fw[i].teamBg + "')");
		$('#temp_table_player div:eq(1)').css("background-color", "#"+fw[i].colorLight);
		$('#temp_table_player div:eq(1)').css("color", "#"+fw[i].colorDark);
		$('#temp_table_player div:eq(1)').html(fw[i].playerName);
		$('#temp_table_player div:eq(2)').css("background-color", "#"+fw[i].colorDark);
		$('#temp_table_player div:eq(2)').css("color", "#"+fw[i].colorLight);
		$('#temp_table_player div:eq(2)').html(fw[i].point);
		$('#temp_table_player td').attr("onclick", "showModal('รายละเอียดของแต้มที่ได้: " + fw[i].playerName + "', '" + fw[i].message + "', false);");
		$('#temp_table_player td .cell_player_captain').remove();
		if( fw[i].captain )	$('#temp_table_player td').append('<div class="cell_player_captain">C</div>');
		html = html + $('#temp_table_player tr').html();
	}
	$('#table_fw tr').html(html);

	$('#table_sub td:eq(1) div:eq(0)').css("background-image", "url('images/" + sub_gk.teamBg + "')");
	$('#table_sub td:eq(1) div:eq(1)').css("background-color", "#"+sub_gk.colorLight);
	$('#table_sub td:eq(1) div:eq(1)').css("color", "#"+sub_gk.colorDark);
	$('#table_sub td:eq(1) div:eq(1)').html(sub_gk.playerName);
	$('#table_sub td:eq(1) div:eq(2)').css("background-color", "#"+sub_gk.colorDark);
	$('#table_sub td:eq(1) div:eq(2)').css("color", "#"+sub_gk.colorLight);
	$('#table_sub td:eq(1) div:eq(2)').html(sub_gk.point);
	$('#table_sub td').attr("onclick", "showModal('รายละเอียดของแต้มที่ได้: " + sub_gk.playerName + "', '" + sub_gk.message + "', false);");
	
	for(i = 0; i < sub_other.length; i++) {
		$('#table_sub td:eq('+(2+i)+') div:eq(0)').css("background-image", "url('images/" + sub_other[i].teamBg + "')");
		$('#table_sub td:eq('+(2+i)+') div:eq(1)').css("background-color", "#"+sub_other[i].colorLight);
		$('#table_sub td:eq('+(2+i)+') div:eq(1)').css("color", "#"+sub_other[i].colorDark);
		$('#table_sub td:eq('+(2+i)+') div:eq(1)').html(sub_other[i].playerName);
		$('#table_sub td:eq('+(2+i)+') div:eq(2)').css("background-color", "#"+sub_other[i].colorDark);
		$('#table_sub td:eq('+(2+i)+') div:eq(2)').css("color", "#"+sub_other[i].colorLight);
		$('#table_sub td:eq('+(2+i)+') div:eq(2)').html(sub_other[i].point);
		$('#table_sub td:eq('+(2+i)+')').attr("onclick", "showModal('รายละเอียดของแต้มที่ได้: " + sub_other[i].playerName + "', '" + sub_other[i].message + "', false);");
	}

	$('#point_fixture').text(totalWeekPoint - <?= $iMinusPoint?>);
}

</script>