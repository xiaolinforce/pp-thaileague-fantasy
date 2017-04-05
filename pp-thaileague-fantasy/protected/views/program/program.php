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

.cell_score_time.active_match {
	background-color: #FFA6AC;
}

#table_score_table th {
	text-align: center;
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
						<?php 
							foreach( $aFixtures as $aEachFixture ) {
						?>
							<option value="<?= $aEachFixture['weekId'] ?>" <?= $aEachFixture['weekId'] == $iLatestWeekId ? 'selected' : '' ?>>
								<?= $aEachFixture['weekName'] ?>
							</option>
						<?php 
							}
						?>
					</select>
				</td>
			</tr>
		</table>
	</div>
	
	<div style="text-align: center; margin-top: 20px;">
		<div class="btn-group">
			<button type="button" class="btn btn-warning" onclick="showMatchByWeek(<?= $iLatestWeekId ?>)">สัปดาห์ล่าสุด</button>
			<button type="button" class="btn btn-warning" onclick="showMatchAllWeek()">ดูทั้งหมด</button>
			<button type="button" class="btn btn-warning" data-toggle="modal" data-target="#modal_score_table">ตารางคะแนน</button>
		</div>
	</div>
	
	<div style="margin-top: 20px; height: 470px; overflow-y: auto;">
		<table class="table table-bordered matches">
			<tbody>
			<?php
				$sOldFixture = "";
				$sOldDate = "";
				$i = 0;
				foreach( $aMatches as $aEachMatches ) {
			?>
				<tr class="week_<?= $aEachMatches['weekId'] ?>">
				
				<?php
					if( $sOldFixture != $aEachMatches['fixtureName'] ) {
						$sOldFixture = $aEachMatches['fixtureName'];
				?>
					<td rowspan="9" style="width: 10%; text-align: center; vertical-align: inherit;"><?= $sOldFixture ?></td>
				<?php
					}
				?>
				
				<?php
					if( $sOldDate != $aEachMatches['date'] ) {
						$sOldDate = $aEachMatches['date'];
						$iCountMatchesInDate = 0;
						for($j = $i; $j < count($aMatches) && $sOldDate == $aMatches[$j]['date']; $j++) {
							$iCountMatchesInDate++;
						}
				?>
					<td rowspan="<?= $iCountMatchesInDate ?>" style="width: 18%; text-align: center; vertical-align: inherit;"><?= $sOldDate ?></td>
				<?php
					}
				?>
					
					<td style="width: 30%; text-align: right;">
						<span><?= $aEachMatches['homeName'] ?></span>
						<img src="<?= $aEachMatches['homeImg'] ?>" style="width: 50px; border-radius: 5px;">
					</td>
					<td class="cell_score_time" style="text-align: center;" onclick="onclickGetMatchDetail(<?= $aEachMatches['matchId'] ?>)">
						<?= $aEachMatches['homeScore'] == null ? $aEachMatches['time'] : $aEachMatches['homeScore'] . ' - ' . $aEachMatches['awayScore'] ?>
					</td>
					<td style="width: 30%;">
						<img src="<?= $aEachMatches['awayImg'] ?>" style="width: 50px; border-radius: 5px;">
						<span><?= $aEachMatches['awayName'] ?></span>
					</td>
				</tr>
			<?php 
					$i++;
				}
			?>
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
			
			<table style="width: 100%;">
			<tr valign="top">
			
			<td style="width: 50%; padding: 5px;">
				
				<table id="table_home_lineup" class="table table-bordered" style="width: 100%; background-color: #b31f24; color: white;">
				<tbody>
					<tr>
						<td colspan="4" style="text-align: center; font-weight: bold; background-color: white; color: #b31f24;">ตัวจริง</td>
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
						<td colspan="4" style="text-align: center; font-weight: bold; background-color: white; color: #b31f24;">ตัวสำรอง</td>
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
			
				<table id="table_away_lineup" class="table table-bordered" style="width: 100%; background-color: #b31f24; color: white;">
				<tbody>
					<tr>
						<td colspan="4" style="text-align: center; font-weight: bold; background-color: white; color: #b31f24;">ตัวจริง</td>
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
						<td colspan="4" style="text-align: center; font-weight: bold; background-color: white; color: #b31f24;">ตัวสำรอง</td>
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

<!-- Score Table Modal -->
<div id="modal_score_table" class="modal fade" role="dialog">
	<div class="modal-dialog modal-lg">

		<!-- Modal content-->
		<div class="modal-content">
			<div class="modal-header" style="background-color: #B31F24; color: white;">
				<h4 class="modal-title" style="font-size: 24px;">ตารางคะแนน</h4>
			</div>
			<div class="modal-body">
			
				<table id="table_score_table" class="table table-bordered table-hover">
				
				<thead>
				<tr>
					<th style="width: 5%;">#</th>
					<th>ทีม</th>
					<th style="width: 7%;">แข่ง</th>
					<th style="width: 7%;">ชนะ</th>
					<th style="width: 7%;">เสมอ</th>
					<th style="width: 7%;">แพ้</th>
					<th style="width: 7%;">ได้</th>
					<th style="width: 7%;">เสีย</th>
					<th style="width: 7%;">ได้เสีย</th>
					<th style="width: 10%;">คะแนน</th>
				</tr>
				</thead>
				
				<tbody>
					<?php 
						foreach( $aScoreTable as $aEachTeam ) {
					?>
						<tr>
							<td style="text-align: center; font-size: 18px;"><?= $aEachTeam['place'] ?></td>
							<td>
								<img src="<?= Helpers::getThumbnailSrc('images/'.$aEachTeam['club_image'], 50) ?>" style="width: 50px; border-radius: 5px;">
								<span style="padding-left: 5px;"><?= $aEachTeam['club_name'] ?></span>
							</td>
							<td style="text-align: center;"><?= $aEachTeam['played'] ?></td>
							<td style="text-align: center;"><?= $aEachTeam['win'] ?></td>
							<td style="text-align: center;"><?= $aEachTeam['draw'] ?></td>
							<td style="text-align: center;"><?= $aEachTeam['lose'] ?></td>
							<td style="text-align: center;"><?= $aEachTeam['goal_for'] ?></td>
							<td style="text-align: center;"><?= $aEachTeam['goal_against'] ?></td>
							<td style="text-align: center;"><?= $aEachTeam['goal_difference'] ?></td>
							<td style="text-align: center; font-size: 18px;"><?= $aEachTeam['point'] ?></td>
						</tr>
					<?php 
						}
					?>
				</tbody>
				
				</table>
				
			</div>
			<div class="modal-footer" style="background-color: #B31F24; color: white;">
				<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
			</div>
		</div>

	</div>
</div>

<script>

var currentMatchId = 0;

$(document).ready(function(){

	onclickGetMatchDetail(1);
	setStyleClickMatch();
	showMatchByWeek(1);
	onchangeWeekSelect();
});

function onclickGetMatchDetail(iMatchId) {
	currentMatchId = iMatchId;
	$.ajax({
		url: "?r=Program/GetMatchDetail",
		data: {
			iMatchId: iMatchId
		},
		type: 'GET',
		dataType: 'JSON',
		success: function(data){
			if( data.matchId != currentMatchId )
				return;
			
			/* Get Scores */
			iHomeScore = null;
			iAwayScore = null;
			if( data.homeScore != null ) {
				iHomeScore = data.homeScore;
				iAwayScore = data.awayScore;
			}
			
			/* Set Match Player */
			aHomeMp = [];
			aAwayMp = [];
			for( i = 0; i < data.matchPlayer.length; i++ ) {
				sName = data.matchPlayer[i].nation == 189 ? data.matchPlayer[i].name + ' ' + data.matchPlayer[i].surname : data.matchPlayer[i].calledName;
				oPlayer = {
						shirtNo: data.matchPlayer[i].shirtNo,
						position: data.matchPlayer[i].position,
						name: sName,
						captain: data.matchPlayer[i].captain == 1,
					}
				if( data.matchPlayer[i].clubId == data.home_id )
					aHomeMp.push(oPlayer);
				else
					aAwayMp.push(oPlayer);
			}
			
			/* Set Match Event */
			aEvent = [];
			for( i = 0; i < data.matchEvent.length; i++ ) {
				// Set Minute
				if( data.matchEvent[i].period == 1 && data.matchEvent[i].minute <= 45 )
					sMinute = data.matchEvent[i].minute + "'";
				else if( data.matchEvent[i].period == 1 && data.matchEvent[i].minute > 45 )
					sMinute = "45'+" + (data.matchEvent[i].minute - 45) + "'";
				else if( data.matchEvent[i].period == 2 && data.matchEvent[i].minute <= 90 )
					sMinute = data.matchEvent[i].minute + "'";
				else if( data.matchEvent[i].period == 2 && data.matchEvent[i].minute > 90 )
					sMinute = "90'+" + (data.matchEvent[i].minute - 90) + "'";
				
				// Set Player
				sName1 = data.matchEvent[i].nation1 == 189 ? data.matchEvent[i].name1 + ' ' + data.matchEvent[i].surname1 : data.matchEvent[i].calledName1;
				sName2 = '';
				if( data.matchEvent[i].name2 != null )
					sName2 = data.matchEvent[i].nation2 == 189 ? data.matchEvent[i].name2 + ' ' + data.matchEvent[i].surname2 : data.matchEvent[i].calledName2;
				if( data.matchEvent[i].type == "GOAL" && sName2 != "" ) {
					sName1 += " (GOAL)";
					sName2 += " (ASSIST)";
				}
				if( data.matchEvent[i].type == "SUB" ) {
					sName1 += " (IN)";
					sName2 += " (OUT)";
				}
				if( data.matchEvent[i].type == "PEN(M)" ) {
					sName2 += " (GK)";
				}
				
				aEvent.push({
					minute: sMinute,
					type: data.matchEvent[i].type_image,
					team: data.matchEvent[i].team,
					player: sName2 == "" ? sName1 : sName1 + '<br>' + sName2,
				});
			}
				
			setMatchDetail(data.homeImg, data.awayImg, iHomeScore, iAwayScore, data.date, data.time, data.stadium, aHomeMp, aAwayMp, aEvent );
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
			$('#table_home_lineup tbody').append('<tr><td colspan="4" style="text-align: center; font-weight: bold; background-color: #FFF0F1; color: #b31f24;">ตัวจริง</td></tr>');
		else if( i == 11 )
			$('#table_home_lineup tbody').append('<tr><td colspan="4" style="text-align: center; font-weight: bold; background-color: #FFF0F1; color: #b31f24;">ตัวสำรอง</td></tr>');

		sHtml = ''+
			'<tr>'+
				'<td style="text-align: center; width: 12%;">'+aPlayerHome[i].shirtNo+'</td>'+
				'<td style="text-align: center; width: 12%;">'+aPlayerHome[i].position+'</td>'+
				'<td>'+aPlayerHome[i].name+'</td>'+
				'<td style="text-align: center; width: 10%;">'+(aPlayerHome[i].captain ? 'C' : '')+'</td>'+
			'</tr>';
		$('#table_home_lineup tbody').append(sHtml);
	}

	$('#table_away_lineup tbody').html('');
	for( i = 0; i < aPlayerAway.length; i++ ) {
		
		if( i == 0 )
			$('#table_away_lineup tbody').append('<tr><td colspan="4" style="text-align: center; font-weight: bold; background-color: #FFF0F1; color: #b31f24;">ตัวจริง</td></tr>');
		else if( i == 11 )
			$('#table_away_lineup tbody').append('<tr><td colspan="4" style="text-align: center; font-weight: bold; background-color: #FFF0F1; color: #b31f24;">ตัวสำรอง</td></tr>');

		sHtml = ''+
			'<tr>'+
				'<td style="text-align: center; width: 12%;">'+aPlayerAway[i].shirtNo+'</td>'+
				'<td style="text-align: center; width: 12%;">'+aPlayerAway[i].position+'</td>'+
				'<td>'+aPlayerAway[i].name+'</td>'+
				'<td style="text-align: center; width: 10%;">'+(aPlayerAway[i].captain ? 'C' : '')+'</td>'+
			'</tr>';
		$('#table_away_lineup tbody').append(sHtml);
	}

	$('#div_match_event tbody').html('');
	for( i = 0; i < aEvent.length; i++ ) {
		sHtml = ''+
			'<tr>'+
				'<td style="width: 10%; text-align: center;">'+aEvent[i].minute+'</td>'+
				/*'<td style="width: 10%; text-align: center;">'+aEvent[i].type+'</td>'+*/
				'<td style="width: 10%; text-align: center;"><img src="images/'+aEvent[i].type+'" style="width: 20px;"></td>'+
				'<td style="width: 20%; text-align: center; background-color: #b31f24; color: white;">'+aEvent[i].team+'</td>'+
				'<td style="background-color: #b31f24; color: white;">'+aEvent[i].player+'</td>'+
			'</tr>';
		$('#div_match_event tbody').append(sHtml);
	}
		
}

function setStyleClickMatch() {
	$('.cell_score_time').click(function(){
		$('.cell_score_time').removeClass('active_match');
		$(this).addClass('active_match');
	});
}

function showMatchByWeek(iWeekId) {
	$('table.matches tr').hide();
	$('.week_' + iWeekId).show();
	$('#sel_week').val(iWeekId);
}

function showMatchAllWeek() {
	$('table.matches tr').show();
}

function onchangeWeekSelect() {
	$('#sel_week').change(function(){
		showMatchByWeek( $('#sel_week').val() );
	});
}

</script>