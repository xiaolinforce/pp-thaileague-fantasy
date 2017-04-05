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

.cell_score_time {
	cursor: pointer;
}

.cell_score_time:hover {
	background-color: #FFF0F1;
}

</style>

<table style="width: 100%">
<tr>

<td valign="top" style="width: 50%; padding: 20px;">

	<div style="text-align: center;">
		<table id="table_choose_week">
			<tr>
				<td>เลือกสัปดาห์</td>
				<td>
					<select id="sel_week" class="js-example-basic-single" style="width: 150px;">
						<option value="AL">Fixture 1</option>
						<option value="WY" selected>Fixture 2</option>
					</select>
				</td>
			</tr>
		</table>
	</div>
	
	<div style="text-align: center; margin-top: 20px;">
		<div class="btn-group">
			<button type="button" class="btn btn-warning">สัปดาห์ล่าสุด</button>
			<button type="button" class="btn btn-warning">ดูทั้งหมด</button>
			<button type="button" class="btn btn-warning">ตารางคะแนน</button>
		</div>
	</div>
	
	<div style="margin-top: 20px; height: 470px; overflow-y: auto;">
		<table class="table table-bordered">
			<tbody>
				<tr>
					<td rowspan="6" style="width: 10%; text-align: center; vertical-align: inherit;">Fixture 1</td>
					<td rowspan="3" style="width: 18%; text-align: center; vertical-align: inherit;">1 ม.ค. 2560</td>
					<td style="width: 28%; text-align: right;">
						<span>เมืองทอง</span>
						<img src="images/team_background_squad/muang_thong.png" style="width: 50px; border-radius: 5px;">
					</td>
					<td class="cell_score_time" style="text-align: center;">18:00</td>
					<td style="width: 28%;">
						<img src="images/team_background_squad/buriram.png" style="width: 50px; border-radius: 5px;">
						<span>บุรีรัมย์</span>
					</td>
				</tr>
				<tr>
					<td style="width: 28%; text-align: right;">
						<span>เมืองทอง</span>
						<img src="images/team_background_squad/muang_thong.png" style="width: 50px; border-radius: 5px;">
					</td>
					<td class="cell_score_time" style="text-align: center;">18:00</td>
					<td style="width: 28%;">
						<img src="images/team_background_squad/buriram.png" style="width: 50px; border-radius: 5px;">
						<span>บุรีรัมย์</span>
					</td>
				</tr>
				<tr>
					<td style="width: 28%; text-align: right;">
						<span>เมืองทอง</span>
						<img src="images/team_background_squad/muang_thong.png" style="width: 50px; border-radius: 5px;">
					</td>
					<td class="cell_score_time" style="text-align: center;">18:00</td>
					<td style="width: 28%;">
						<img src="images/team_background_squad/buriram.png" style="width: 50px; border-radius: 5px;">
						<span>บุรีรัมย์</span>
					</td>
				</tr>
				<tr>
					<td rowspan="3" style="width: 20%; text-align: center; vertical-align: inherit;">1 ม.ค. 2560</td>
					<td style="width: 28%; text-align: right;">
						<span>เมืองทอง</span>
						<img src="images/team_background_squad/muang_thong.png" style="width: 50px; border-radius: 5px;">
					</td>
					<td class="cell_score_time" style="text-align: center;">18:00</td>
					<td style="width: 28%;">
						<img src="images/team_background_squad/buriram.png" style="width: 50px; border-radius: 5px;">
						<span>บุรีรัมย์</span>
					</td>
				</tr>
				<tr>
					<td style="width: 28%; text-align: right;">
						<span>เมืองทอง</span>
						<img src="images/team_background_squad/muang_thong.png" style="width: 50px; border-radius: 5px;">
					</td>
					<td class="cell_score_time" style="text-align: center;">18:00</td>
					<td style="width: 28%;">
						<img src="images/team_background_squad/buriram.png" style="width: 50px; border-radius: 5px;">
						<span>บุรีรัมย์</span>
					</td>
				</tr>
				<tr>
					<td style="width: 28%; text-align: right;">
						<span>เมืองทอง</span>
						<img src="images/team_background_squad/muang_thong.png" style="width: 50px; border-radius: 5px;">
					</td>
					<td class="cell_score_time" style="text-align: center;">18:00</td>
					<td style="width: 28%;">
						<img src="images/team_background_squad/buriram.png" style="width: 50px; border-radius: 5px;">
						<span>บุรีรัมย์</span>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
	
</td>

<td valign="top" style="width: 50%; padding: 20px; border: 1px solid #e6e6e6; height: 100vh; overflow-y: auto;">
	
	<div style="text-align: center;">
		<img id="img_home" src="images/team_background_squad/muang_thong.png" style="width: 100px; border-radius: 5px;">
		<img id="img_away" src="images/team_background_squad/buriram.png" style="width: 100px; border-radius: 5px;">
	</div>
	
	<p id="text_score" style="text-align: center; font-size: 35px; margin-top: 20px;">ยังไม่แข่ง</p>
	
	<p id="text_date_time_stadium" style="text-align: center; font-size: 18px; color: #ec8386">วันเสาร์ที่ 1 มกราคม พ.ศ. 2560<br>18:00<br>สนามไอโมบาย สเตเดียม</p>
	
	<div style="text-align: center; margin-top: 20px;">
		<div class="btn-group">
			<button type="button" class="btn btn-warning" data-toggle="tab" href="#div_match_play">รายชื่อผู้เล่น</button>
			<button type="button" class="btn btn-warning" data-toggle="tab" href="#div_match_event">เหตุการณ์</button>
		</div>
	</div>

	<div class="tab-content" style="margin-top: 20px;">
		<div id="div_match_play" class="tab-pane fade in active">
			
			<table style="width: 100%">
			<tr>
			
			<td style="width: 50%; padding: 5px;">
				
				<table id="table_home_lineup" class="table table-bordered" style="width: 100%">
				<tbody>
					<tr>
						<td colspan="4" style="text-align: center; font-weight: bold;">ตัวจริง</td>
					</tr>
					<tr>
						<td style="text-align: center;">1</td>
						<td style="text-align: center;">GK</td>
						<td>กวิน ทำไมสัสหรือจะเอา</td>
						<td style="text-align: center;">C</td>
					</tr>
					<tr>
						<td style="text-align: center;">1</td>
						<td style="text-align: center;">GK</td>
						<td>กวิน ทำไมสัสหรือจะเอา</td>
						<td style="text-align: center;">C</td>
					</tr>
					<tr>
						<td colspan="4" style="text-align: center; font-weight: bold;">ตัวสำรอง</td>
					</tr>
					<tr>
						<td style="text-align: center;">1</td>
						<td style="text-align: center;">GK</td>
						<td>กวิน ทำไมสัสหรือจะเอา</td>
						<td style="text-align: center;">C</td>
					</tr>
				</tbody>
				</table>

			</td>
			
			<td style="width: 50%; padding: 5px;">
			
				<table id="table_away_lineup" class="table table-bordered" style="width: 100%">
				<tbody>
					<tr>
						<td colspan="4" style="text-align: center; font-weight: bold;">ตัวจริง</td>
					</tr>
					<tr>
						<td style="text-align: center;">1</td>
						<td style="text-align: center;">GK</td>
						<td>กวิน ทำไมสัสหรือจะเอา</td>
						<td style="text-align: center;">C</td>
					</tr>
					<tr>
						<td style="text-align: center;">1</td>
						<td style="text-align: center;">GK</td>
						<td>กวิน ทำไมสัสหรือจะเอา</td>
						<td style="text-align: center;">C</td>
					</tr>
					<tr>
						<td colspan="4" style="text-align: center; font-weight: bold;">ตัวสำรอง</td>
					</tr>
					<tr>
						<td style="text-align: center;">1</td>
						<td style="text-align: center;">GK</td>
						<td>กวิน ทำไมสัสหรือจะเอา</td>
						<td style="text-align: center;">C</td>
					</tr>
				</tbody>
				</table>
				
			</td>
			
			</tr>
			</table>

		</div>
		<div id="div_match_event" class="tab-pane fade">

			<table class="table table-bordered" style="width: 100%;">
			<tbody>
				<tr>
					<td style="width: 10%; text-align: center;">3'</td>
					<td style="width: 10%; text-align: center;">GOAL</td>
					<td style="width: 20%; text-align: center;">เมืองทอง</td>
					<td>กวิน ทำไมสัสหรือจะเอา</td>
				</tr>
			</tbody>
			</table>

		</div>
	</div>

</td>
</tr>
</table>

<script>

$(document).ready(function(){

	
});

function onclickGetMatchDetail(iMatchId) {
	
	$.ajax({
		url: "?r=Program/GetMatchDetail",
		data: {
			iMatchId: iMatchId
		},
		type: 'POST',
		dataType: 'JSON',
		success: function(data){
			
		},
		error: function(){
			alert('ERROR');
		},
				        
	});
}

function setMatchDetail(sHomeImg, sAwayImg, iHomeScore, iAwayScore, sDate, sTime, sStadium, aPlayerHome, aPlayerAway, aEvent ) {

	$('#img_home').attr('src', sHomeImg);
	$('#img_away').attr('src', sAwayImg);
	
	if( iHomeScore == null )
		$('#text_score').text('ยังไม่แข่ง');
	else
		$('#text_score').text(iHomeScore + ' - ' + iAwayScore);

	$('#text_date_time_stadium').html(sDate + '<br>' + sTime + '<br>' + sStadium);

	$('#table_home_lineup tbody').html('');
	for( i = 0; i < aPlayerHome.length; i++ ) {
		
		if( i == 0 )
			$('#table_home_lineup tbody').append('<tr><td colspan="4" style="text-align: center; font-weight: bold;">ตัวจริง</td></tr>');
		else if( i == 11 )
			$('#table_home_lineup tbody').append('<tr><td colspan="4" style="text-align: center; font-weight: bold;">ตัวสำรอง</td></tr>');

		sHtml = ''+
			'<tr>'+
				'<td style="text-align: center;">'+aPlayerHome[i].shirtNo+'</td>'+
				'<td style="text-align: center;">'+aPlayerHome[i].position+'</td>'+
				'<td>'+aPlayerHome[i].name+'</td>'+
				'<td style="text-align: center;">'+(aPlayerHome[i].captain ? 'C' : '')+'</td>'+
			'</tr>';
		$('#table_home_lineup tbody').append(sHtml);
	}

	$('#table_away_lineup tbody').html('');
	for( i = 0; i < aPlayerAway.length; i++ ) {
		
		if( i == 0 )
			$('#table_away_lineup tbody').append('<tr><td colspan="4" style="text-align: center; font-weight: bold;">ตัวจริง</td></tr>');
		else if( i == 11 )
			$('#table_away_lineup tbody').append('<tr><td colspan="4" style="text-align: center; font-weight: bold;">ตัวสำรอง</td></tr>');

		sHtml = ''+
			'<tr>'+
				'<td style="text-align: center;">'+aPlayerAway[i].shirtNo+'</td>'+
				'<td style="text-align: center;">'+aPlayerAway[i].position+'</td>'+
				'<td>'+aPlayerAway[i].name+'</td>'+
				'<td style="text-align: center;">'+(aPlayerAway[i].captain ? 'C' : '')+'</td>'+
			'</tr>';
		$('#table_away_lineup tbody').append(sHtml);
	}

	$('#div_match_event tbody').html('');
	for( i = 0; i < aEvent.length; i++ ) {
		sHtml = ''+
			'<tr>'+
				'<td style="width: 10%; text-align: center;">'+aEvent[i].minute+'</td>'+
				'<td style="width: 10%; text-align: center;">'+aEvent[i].type+'</td>'+
				'<td style="width: 20%; text-align: center;">'+aEvent[i].team+'</td>'+
				'<td>'+aEvent[i].player+'</td>'+
			'</tr>';
		$('#div_match_event tbody').append(sHtml);
	}
		
}

</script>