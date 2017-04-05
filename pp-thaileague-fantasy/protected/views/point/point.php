<style>

#table_choose_week {
	display: inline;
}

#table_choose_week td {
	padding: 10px;
}

#table_choose_week td:nth-child(1) {
	background-color: #b31f24;
	color: white;
	font-size: 16px;
	border-radius: 10px 0 0 10px;
}

#table_choose_week td:nth-child(2) {
	background-color: #FFF0F1;
	font-size: 16px;
	border-radius: 0 10px 10px 0;
}

#table_show_point {
	display: inline;
}

.cell_total_point_head {
	width: 220px;
	text-align: center;
	font-size: 16px;
	background-color: #b31f24;
	color: white;
	padding: 5px 0;
}

.cell_total_point {
	text-align: center;
	font-size: 22px;
	background-color: #FFF0F1;
	color: #b31f24;
	padding: 10px 0;
}

</style>

<div style="text-align: center;">

	<table id="table_choose_week">
		<tr>
			<td>เลือกสัปดาห์</td>
			<td>
				<select id="sel_week" class="js-example-basic-single" style="width: 150px;">
				</select>
			</td>
		</tr>
	</table>

</div>

<div style="text-align: center; margin-top: 20px;">

	<table id="table_show_point">
		<tr>
			<td class="cell_total_point_head">คะแนนประจำสัปดาห์</td>
			<td class="cell_total_point_head">คะแนนรวม</td>
		</tr>
		<tr>
			<td id="point_fixture" class="cell_total_point">1</td>
			<td id="point_total" class="cell_total_point"><?= $iTotalPoint ?></td>
		</tr>
	</table>

</div>

<div id="div_content_point" style="margin-top: 20px;"></div>

<div id="div_loading_point" style="padding: 20px; text-align: center; display: none;">
	<img src="images/loading.gif">
</div>

<script>

$(document).ready(function(){

	$("#sel_week").select2();
	onchangeFixture();
	listFixture();
	displayPlayerPoint(<?= $iLatestWeek ?>);
});

function onchangeFixture() {
	$("#sel_week").change(function(){
		displayPlayerPoint( $("#sel_week").val() );
	});
}

function listFixture() {
	$('#sel_week').empty();
	//$('#sel_week').append('<option value="1">Fixture 1</option>');
	//$('#sel_week').append('<option value="2">Fixture 2</option>');

	<?php
		foreach( $aPlayedWeeks as $aEachWeek ) {
	?>
		$('#sel_week').append('<option value="<?= $aEachWeek['week_id'] ?>" <?= $aEachWeek['week_id'] == $iLatestWeek ? 'selected' : '' ?>><?= $aEachWeek['week_name'] ?></option>');
	<?php
		}
	?>
}

function setTotalPoint(fixturePoint, totalPoint) {
	$('#point_fixture').text( fixturePoint );
	$('#point_total').text( totalPoint );
}

function displayPlayerPoint(weekId) {
	$('#div_loading_2').show();
	$.ajax({
		url: "?r=Point/RenderPointByWeek",
		data: {
			week_id: weekId
		},
		type: 'GET',
		success: function(data){
			if( data == 0 ) {
				alert('ERROR');
				$('#div_loading_2').hide();
			}
			else {
				$('#div_content_point').html(data);
				$('#div_loading_2').hide();
			}
		},
		error: function(){
			alert('ERROR');
			$('#div_loading_2').hide();
		},		        
	});
}

</script>