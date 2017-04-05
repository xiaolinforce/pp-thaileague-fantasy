<style>

.cell_quota_head {
	width: 220px;
	text-align: center;
	background-color: #b31f24;
	color: white;
	padding: 5px 0;
}

.cell_quota_detail {
	width: 220px;
	text-align: center;
	background-color: #FFF0F1;
	color: #b31f24;
	padding: 5px 0;
}

#div_transfer_cover {
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

.label_filter_head {
	width: 120px;
	text-align: right;
}

#table_filter_player th {
	text-align: center;
}

#table_filter_player td {
	padding: 5px;
}

#table_filter_player td:nth-child(1),
#table_filter_player td:nth-child(3),
#table_filter_player td:nth-child(4),
#table_filter_player td:nth-child(5) {
	text-align: center;
}

</style>

<div style="text-align: center;">
	<table style="display: inline; font-size: 16px;">
		<tr>
			<td class="cell_quota_head">ย้ายตัวคงเหลือ</td>
			<td class="cell_quota_head">รีเซตทีมคงเหลือ</td>
		</tr>
		<tr>
			<td class="cell_quota_detail">
				<span id="span_move_quota"><?= $iMoveQuota == 15 ? 'ไม่อั้น' : $iMoveQuota ?></span><br>
				<span id="span_reduce_point"></span>
			</td>
			<td class="cell_quota_detail">
				<span id="span_reset_quota"><?= $iResetQuota ?></span><br>
				<button id="btn_reset_team" type="button" class="btn btn-warning" 
					<?= $iResetQuota == 0 || $iMoveQuota == 15 ? 'disabled' : '' ?> 
					onclick="onclickResetTeam()">ใช้รีเซตทีม</button>
			</td>
		</tr>
	</table>
</div>

<table style="width: 100%; margin-top: 20px;">
	<tr>
		<td valign="top" style="width: 60%;">
			<p style="font-size: 18px; text-align: center; color: #b31f24;">
				<span style="font-size: 26px;">ทีมของฉัน</span>
				<br>
				(คลิกที่ผู้เล่นเพื่อย้ายออก)
			</p>
			<div id="div_transfer_cover">
				<table id="table_gk" style="display: inline; border-collapse: separate;">
					<tr>
						<td data-playerId="0" data-teamId="0" data-nationZone="THAI" data-moved="0" class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
							<div class="cell_player_teambg" style="background-color: #848484; background-size: cover;"></div>
							<div class="cell_player_player" style="background-color: #4E4E4E; color: white;">-</div>
							<div class="cell_player_team" style="background-color: white; color: #4E4E4E;">-</div>
						</td>
						<td data-playerId="0" data-teamId="0" data-nationZone="THAI" data-moved="0" class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
							<div class="cell_player_teambg" style="background-color: #848484; background-size: cover;"></div>
							<div class="cell_player_player" style="background-color: #4E4E4E; color: white;">-</div>
							<div class="cell_player_team" style="background-color: white; color: #4E4E4E;">-</div>
						</td>
					</tr>
				</table>
				<br>
				
				<table id="table_df" style="display: inline; border-collapse: separate;">
					<tr>
						<td data-playerId="0" data-teamId="0" data-nationZone="THAI" data-moved="0" class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
							<div class="cell_player_teambg" style="background-color: #848484; background-size: cover;"></div>
							<div class="cell_player_player" style="background-color: #4E4E4E; color: white;">-</div>
							<div class="cell_player_team" style="background-color: white; color: #4E4E4E;">-</div>
						</td>
						<td data-playerId="0" data-teamId="0" data-nationZone="THAI" data-moved="0" class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
							<div class="cell_player_teambg" style="background-color: #848484; background-size: cover;"></div>
							<div class="cell_player_player" style="background-color: #4E4E4E; color: white;">-</div>
							<div class="cell_player_team" style="background-color: white; color: #4E4E4E;">-</div>
						</td>
						<td data-playerId="0" data-teamId="0" data-nationZone="THAI" data-moved="0" class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
							<div class="cell_player_teambg" style="background-color: #848484; background-size: cover;"></div>
							<div class="cell_player_player" style="background-color: #4E4E4E; color: white;">-</div>
							<div class="cell_player_team" style="background-color: white; color: #4E4E4E;">-</div>
						</td>
						<td data-playerId="0" data-teamId="0" data-nationZone="THAI" data-moved="0" class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
							<div class="cell_player_teambg" style="background-color: #848484; background-size: cover;"></div>
							<div class="cell_player_player" style="background-color: #4E4E4E; color: white;">-</div>
							<div class="cell_player_team" style="background-color: white; color: #4E4E4E;">-</div>
						</td>
						<td data-playerId="0" data-teamId="0" data-nationZone="THAI" data-moved="0" class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
							<div class="cell_player_teambg" style="background-color: #848484; background-size: cover;"></div>
							<div class="cell_player_player" style="background-color: #4E4E4E; color: white;">-</div>
							<div class="cell_player_team" style="background-color: white; color: #4E4E4E;">-</div>
						</td>
					</tr>
				</table>
				<br>
				
				<table id="table_md" style="display: inline; border-collapse: separate;">
					<tr>
						<td data-playerId="0" data-teamId="0" data-nationZone="THAI" data-moved="0" class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
							<div class="cell_player_teambg" style="background-color: #848484; background-size: cover;"></div>
							<div class="cell_player_player" style="background-color: #4E4E4E; color: white;">-</div>
							<div class="cell_player_team" style="background-color: white; color: #4E4E4E;">-</div>
						</td>
						<td data-playerId="0" data-teamId="0" data-nationZone="THAI" data-moved="0" class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
							<div class="cell_player_teambg" style="background-color: #848484; background-size: cover;"></div>
							<div class="cell_player_player" style="background-color: #4E4E4E; color: white;">-</div>
							<div class="cell_player_team" style="background-color: white; color: #4E4E4E;">-</div>
						</td>
						<td data-playerId="0" data-teamId="0" data-nationZone="THAI" data-moved="0" class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
							<div class="cell_player_teambg" style="background-color: #848484; background-size: cover;"></div>
							<div class="cell_player_player" style="background-color: #4E4E4E; color: white;">-</div>
							<div class="cell_player_team" style="background-color: white; color: #4E4E4E;">-</div>
						</td>
						<td data-playerId="0" data-teamId="0" data-nationZone="THAI" data-moved="0" class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
							<div class="cell_player_teambg" style="background-color: #848484; background-size: cover;"></div>
							<div class="cell_player_player" style="background-color: #4E4E4E; color: white;">-</div>
							<div class="cell_player_team" style="background-color: white; color: #4E4E4E;">-</div>
						</td>
						<td data-playerId="0" data-teamId="0" data-nationZone="THAI" data-moved="0" class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
							<div class="cell_player_teambg" style="background-color: #848484; background-size: cover;"></div>
							<div class="cell_player_player" style="background-color: #4E4E4E; color: white;">-</div>
							<div class="cell_player_team" style="background-color: white; color: #4E4E4E;">-</div>
						</td>
					</tr>
				</table>
				<br>
				
				<table id="table_fw" style="display: inline; border-collapse: separate;">
					<tr>
						<td data-playerId="0" data-teamId="0" data-nationZone="THAI" data-moved="0" class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
							<div class="cell_player_teambg" style="background-color: #848484; background-size: cover;"></div>
							<div class="cell_player_player" style="background-color: #4E4E4E; color: white;">-</div>
							<div class="cell_player_team" style="background-color: white; color: #4E4E4E;">-</div>
						</td>
						<td data-playerId="0" data-teamId="0" data-nationZone="THAI" data-moved="0" class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
							<div class="cell_player_teambg" style="background-color: #848484; background-size: cover;"></div>
							<div class="cell_player_player" style="background-color: #4E4E4E; color: white;">-</div>
							<div class="cell_player_team" style="background-color: white; color: #4E4E4E;">-</div>
						</td>
						<td data-playerId="0" data-teamId="0" data-nationZone="THAI" data-moved="0" class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
							<div class="cell_player_teambg" style="background-color: #848484; background-size: cover;"></div>
							<div class="cell_player_player" style="background-color: #4E4E4E; color: white;">-</div>
							<div class="cell_player_team" style="background-color: white; color: #4E4E4E;">-</div>
						</td>
					</tr>
				</table>
				<br>

			</div>
			<div style="margin-top: 30px; text-align: center;">
				<button type="button" class="btn btn-success btn-lg" onclick="onclickConfirmTeam()">ยืนยันการย้ายตัว</button>
			</div>
			
		</td>
		
		<td valign="top" style="padding: 20px; border: 1px solid #e6e6e6;">
		
			<p style="font-size: 18px; text-align: center; color: #b31f24;">
				<span style="font-size: 26px;">ตลาด</span>
				<br>
				(เลือกผู้เล่นเพื่อเพิ่มเข้าทีม)
			</p>
			
			<form class="form-inline" style="margin-top: 20px; color: black;">
				<div class="form-group">
					<label for="sel_filter_position" class="label_filter_head">ตำแหน่ง</label>
					<select id="sel_filter_position" class="js-example-basic-single" style="width: 220px; margin-left: 10px;">
						<option value="0" selected>ทุกตำแหน่ง</option>
						<option value="1">ผู้รักษาประตู</option>
						<option value="2">กองหลัง</option>
						<option value="3">กองกลาง</option>
						<option value="4">กองหน้า</option>
					</select>
				</div>
				<div class="form-group" style="margin-top: 10px;">
					<label for="sel_filter_sort" class="label_filter_head">การเรียงลำดับ</label>
					<select id="sel_filter_sort" class="js-example-basic-single" style="width: 220px; margin-left: 10px;">
						<option value="1" selected>จากชื่อ</option>
						<option value="2">จากคะแนนรวม</option>
						<option value="3">จากคะแนนรวม 5 เกมหลัง</option>
					</select>
				</div>
				<div class="form-group" style="margin-top: 10px;">
					<label for="sel_filter_team" class="label_filter_head">ทีม</label>
					<select id="sel_filter_team" class="js-example-basic-single" style="width: 220px; margin-left: 10px;">
						<option value="0" selected>ทุกทีม</option>
						<?php 
							foreach( $aTeams as $aEachTeam ) {
						?>
							<option value="<?= $aEachTeam['id'] ?>"><?= $aEachTeam['name_th'] ?></option>
						<?php 
							}
						?>
					</select>
				</div>
				<div class="form-group" style="margin-top: 10px;">
					<label for="in_filter_player_name" class="label_filter_head">ชื่อผู้เล่น</label>
					<input type="text" class="form-control" id="in_filter_player_name" style="width: 220px; margin-left: 10px;">
				</div>
			</form>

			<div style="height: 300px; overflow-y: auto;">
				<table id="table_filter_player" class="table" style="margin-top: 20px;">
					<thead>
						<tr>
							<th style="width: 88px; color: black;"></th>
							<th style="color: black;">ชื่อ</th>
							<th style="width: 105px; color: black;">ทีม</th>
							<th style="width: 15%; color: black;">แต้มรวม</th>
							<th style="width: 15%; color: black;">แต้ม 5 เกมหลัง</th>
						</tr>
					</thead>
					<tbody>

					</tbody>
				</table>
			</div>

		</td>
	</tr>
</table>

<p style="text-align: center; margin-top: 40px;">ตอนนี้ยังไม่มีระบบค่าตัวนักเตะ สามารถซื้อนักเตะคนไหนก็ได้<br>แต่มีผู้เล่นจากทีมเดียวกันได้ไม่เกิน 2 คน<br>มีผู้เล่นต่างชาติได้ 3 คน และเอเชียได้ 1 คน</p>

<!-- Template -->
<div style="display: none;">
	<table id="temp_table_player" >
		<tr>
			<td>
				<button type="button" class="btn btn-success btn-xs add_player">เพิ่ม</button>
				<button type="button" class="btn btn-info btn-xs">ข้อมูล</button>
			</td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
		</tr>
	</table>
	
	<table id="temp_table_player_out" ><tr>
		<td data-playerId="0" data-teamId="0" class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
			<div class="cell_player_teambg" style="background-color: #848484; background-size: cover;"></div>
			<div class="cell_player_player" style="background-color: #4E4E4E; color: white;">-</div>
			<div class="cell_player_team" style="background-color: white; color: #4E4E4E;">-</div>
		</td>
	</tr></table>
	
	<table id="temp_table_player_in" ><tr>
		<td data-playerId="0" data-teamId="0" class="cell_player" style="border: 2px solid rgba(0, 0, 0, 0);">
			<div class="cell_player_teambg" style="background-color: #848484; background-size: cover;"></div>
			<div class="cell_player_player" style="background-color: #4E4E4E; color: white;">-</div>
			<div class="cell_player_team" style="background-color: white; color: #4E4E4E;">-</div>
		</td>
	</tr></table>
	
</div>

<!-- Modal Confirm Reset Team -->
<div id="modal_confirm_reset" class="modal fade" role="dialog">
	<div class="modal-dialog">

		<!-- Modal content-->
		<div class="modal-content">
			<div class="modal-header" style="background-color: #B31F24;">
				<h4 class="modal-title" style="color: white; font-size: 25px;">ยืนยันการรีเซ็ตทีม</h4>
			</div>
			<div class="modal-body">
				<p style="font-size: 18px;">คุณแน่ใจหรือไม่ที่จะทำการรีเซ็ตทีม</p>
			</div>
			<div class="modal-footer" style="background-color: #B31F24;">
				<button type="button" class="btn btn-warning" data-dismiss="modal" onclick="onclickConfirmResetTeam()">ยืนยัน</button>
				<button type="button" class="btn btn-default" data-dismiss="modal">ยกเลิก</button>
			</div>
		</div>

	</div>
</div>
<script>

$(document).ready(function(){

	onchangeSearchPlayer();
	onclickPlayerOut();
	searchPlayer();
	initialMyTeam();
});

function initialMyTeam() {
	players = [];
	<?php 
		if( count($aMyTeam) != 0 ) {
	?>
		<?php 
			for( $i = 0; $i < count($aMyTeam); $i++ ) {
		?>
			players.push({
				playerId: <?= $aMyTeam[$i]['player_id'] ?>,
				teamId: <?= $aMyTeam[$i]['team_id'] ?>,
				nationId: <?= $aMyTeam[$i]['nation_id'] ?>,
				nationZone : "<?= $aMyTeam[$i]['nation_zone'] ?>",
				position: <?= $aMyTeam[$i]['position'] ?>,
				playerName: "<?= $aMyTeam[$i]['player_name'] ?>",
				teamName: "<?= $aMyTeam[$i]['team_name'] ?>",
			});
		<?php 
			}
		?>
		checkPos = 0;
		indexPos = 0;
		for( i = 0; i < players.length; i++ ) {

			if( players[i].position == 1 ) tableName = "#table_gk";
			else if( players[i].position == 2 ) tableName = "#table_df";
			else if( players[i].position == 3 ) tableName = "#table_md";
			else tableName = "#table_fw";
			
			if( checkPos != players[i].position ) {
				checkPos = players[i].position;
				indexPos = 0;
			}

			if( players[i].nationId == 189 ) zone = "THAI";
			else zone = players[i].nationZone;
			
			$(tableName + ' td').eq(indexPos).attr("data-playerId", players[i].playerId);
			$(tableName + ' td').eq(indexPos).attr("data-teamId", players[i].teamId);
			$(tableName + ' td').eq(indexPos).attr("data-nationZone", zone);
			$(tableName + ' td:eq(' + (indexPos) + ') .cell_player_teambg').css("background-image", "url('"+getTeamInfo("background", players[i].teamId)+"')");
			$(tableName + ' td:eq(' + (indexPos) + ') .cell_player_player').css("background-color", "#"+getTeamInfo("lightColor", players[i].teamId));
			$(tableName + ' td:eq(' + (indexPos) + ') .cell_player_player').text(players[i].playerName);
			$(tableName + ' td:eq(' + (indexPos) + ') .cell_player_team').css("background-color", "#"+getTeamInfo("darkColor", players[i].teamId));
			$(tableName + ' td:eq(' + (indexPos) + ') .cell_player_team').text(players[i].teamName);
			$(tableName + ' td:eq(' + (indexPos) + ') .cell_player_player').css("color", "#"+getTeamInfo("darkColor", players[i].teamId));
			$(tableName + ' td:eq(' + (indexPos) + ') .cell_player_team').css("color", "#"+getTeamInfo("lightColor", players[i].teamId));
			indexPos++;
		}
		
	<?php 
		}
	?>
}

function onchangeSearchPlayer() {

	$('#sel_filter_position').change(function(){
		searchPlayer();
	});

	$('#sel_filter_sort').change(function(){
		searchPlayer();
	});

	$('#sel_filter_team').change(function(){
		searchPlayer();
	});

	$('#in_filter_player_name').on('input', function(){
		searchPlayer();
	});
}

function searchPlayer() {
	$('#table_filter_player tbody').empty();
	$.ajax({
		url: "?r=Transfer/GetPlayers",
		data: {
			iPosition: $('#sel_filter_position').val(),
			iSort: $('#sel_filter_sort').val(),
			iTeamId: $('#sel_filter_team').val(),
			sKeyword: $('#in_filter_player_name').val(),
		},
		type: 'GET',
		dataType: 'JSON',
		success: function(data){
			for( i = 0; i < data.length; i++ ) {
				
				if( data[i].nation_id == 189 ) {
					playerName = data[i].name_th + " " + data[i].surname_th;
					nationZone = "THAI";
				}
				else {
					playerName = data[i].called_name_th;
					nationZone = data[i].nation_zone;
				}

				if( data[i].position_id == 1 )
					position = "GK";
				else if( data[i].position_id == 2 )
					position = "DF";
				else if( data[i].position_id == 3 )
					position = "MD";
				else
					position = "FW";

				
				$('#temp_table_player .add_player').attr("onclick", 
					'onclickAddPlayer('+data[i].player_id+', "'+data[i].called_name_th+'", '+data[i].team_id+', "'+data[i].team_name+'", "'+nationZone+'", "'+position+'")');
				$('#temp_table_player tr td:nth-child(2)').text( playerName );
				$('#temp_table_player tr td:nth-child(3)').text( data[i].team_name );
				$('#temp_table_player tr td:nth-child(4)').text( data[i].last_week_point );
				$('#temp_table_player tr td:nth-child(5)').text( data[i].last_5_weeks_point );

				$('#table_filter_player tbody').append( $('#temp_table_player tbody').html() );
			}
		},
		error: function(){
			alert('ERROR');
		},
				        
	});
}

function onclickPlayerOut() {
	$('#table_gk td, #table_df td, #table_md td, #table_fw td').click(function(){
		if( $(this).attr("data-playerId") != 0 ) {
			$(this).attr("data-playerId", "0");
			$(this).attr("data-teamId", "0");
			$(this).attr("data-nationZone", "THAI");
			$(this).html( $('#temp_table_player_out td').html() );
			if( $('#span_move_quota').text() != "ไม่อั้น" && $(this).attr("data-moved") != 1  ) {
				$(this).attr("data-moved", "1");
				$(this).css("border", "2px solid #fcff00");
				moveQuota = parseInt( $('#span_move_quota').text() );
				$('#span_move_quota').text( moveQuota - 1 );
				if( (moveQuota - 1) < 0 ) {
					$('#span_reduce_point').text("(" + ((moveQuota-1) * 4) + " คะแนน)");
				}
			}
		}
	});
}

function onclickAddPlayer(playerId, playerName, teamId, teamName, nationZone, playerPosition) {

	players = getPlayerIn();
	
	/* Check if player is existed */
	for( i = 0; i < players.length; i++ ) {
		if( players[i].playerId == playerId ) {
			showModal('ไม่สามารถเพิ่มนักเตะเข้าทีมได้', 'นักเตะคนนี้อยู่ในทีมของคุณอยู่แล้ว', false);
			return;
		}
	}

	/* Check available team */
	teamCount = 0;
	for( i = 0; i < players.length; i++ ) {
		if( players[i].teamId == teamId )
			teamCount++;
	}
	if( teamCount == 2 ) {
		showModal('ไม่สามารถเพิ่มนักเตะเข้าทีมได้', 'มีนักเตะทีม' + teamName + 'ครบ 2 คนแล้ว เกินกว่านี้ไม่ได้', false);
		return;
	}

	/* Check AFC */
	if( nationZone == "AFC" ) {
		zoneCount = 0;
		for( i = 0; i < players.length; i++ ) {
			if( players[i].nationZone != "THAI" )
				zoneCount++;
		}
		if( zoneCount >= 4 ) {
			showModal('ไม่สามารถเพิ่มนักเตะเข้าทีมได้', 'มีนักเตะต่างชาติครบ 4 คนแล้ว ไม่สามารถเพิ่มมากกว่านี้ได้', false);
			return;
		}
	}

	/* Check Foreigner */
	if( nationZone != "THAI" && nationZone != "AFC" ) {
		afcCount = 0;
		foreignerCount = 0;
		for( i = 0; i < players.length; i++ ) {
			if( players[i].nationZone == "AFC" )
				afcCount++;
			if( players[i].nationZone != "THAI" && players[i].nationZone != "AFC" )
				foreignerCount++;
		}
		if( afcCount + foreignerCount == 4 || foreignerCount == 3 ) {
			showModal('ไม่สามารถเพิ่มนักเตะเข้าทีมได้', 'มีนักเตะต่างชาติครบ 3 คนแล้ว ไม่สามารถเพิ่มมากกว่านี้ได้', false);
			return;
		}
	}

	/* Get available seat */
	availableSeat = 0;
	for( i = 0; i < players.length; i++ ) {
		if( playerPosition == players[i].position && players[i].playerId == 0 )
			availableSeat = players[i].index;
	}
	if( availableSeat == 0 ) {
		showModal('ไม่สามารถเพิ่มนักเตะเข้าทีมได้', 'มีนักเตะตำแหน่งนี้ในทีมของคุณครบแล้ว', false);
		return;
	}
	
	if( playerPosition == "GK" ) {
		$('#table_gk td').eq(availableSeat-1).attr("data-playerId", playerId);
		$('#table_gk td').eq(availableSeat-1).attr("data-teamId", teamId);
		$('#table_gk td').eq(availableSeat-1).attr("data-nationZone", nationZone);
		$('#table_gk td:eq(' + (availableSeat-1) + ') .cell_player_teambg').css("background-image", "url('"+getTeamInfo("background", teamId)+"')");
		$('#table_gk td:eq(' + (availableSeat-1) + ') .cell_player_player').css("background-color", "#"+getTeamInfo("lightColor", teamId));
		$('#table_gk td:eq(' + (availableSeat-1) + ') .cell_player_player').text(playerName);
		$('#table_gk td:eq(' + (availableSeat-1) + ') .cell_player_team').css("background-color", "#"+getTeamInfo("darkColor", teamId));
		$('#table_gk td:eq(' + (availableSeat-1) + ') .cell_player_team').text(teamName);
		$('#table_gk td:eq(' + (availableSeat-1) + ') .cell_player_player').css("color", "#"+getTeamInfo("darkColor", teamId));
		$('#table_gk td:eq(' + (availableSeat-1) + ') .cell_player_team').css("color", "#"+getTeamInfo("lightColor", teamId));
	}
	else if( playerPosition == "DF" ) {
		$('#table_df td').eq(availableSeat-1).attr("data-playerId", playerId);
		$('#table_df td').eq(availableSeat-1).attr("data-teamId", teamId);
		$('#table_df td').eq(availableSeat-1).attr("data-nationZone", nationZone);
		$('#table_df td:eq(' + (availableSeat-1) + ') .cell_player_teambg').css("background-image", "url('"+getTeamInfo("background", teamId)+"')");
		$('#table_df td:eq(' + (availableSeat-1) + ') .cell_player_player').css("background-color", "#"+getTeamInfo("lightColor", teamId));
		$('#table_df td:eq(' + (availableSeat-1) + ') .cell_player_player').text(playerName);
		$('#table_df td:eq(' + (availableSeat-1) + ') .cell_player_team').css("background-color", "#"+getTeamInfo("darkColor", teamId));
		$('#table_df td:eq(' + (availableSeat-1) + ') .cell_player_team').text(teamName);
		$('#table_df td:eq(' + (availableSeat-1) + ') .cell_player_player').css("color", "#"+getTeamInfo("darkColor", teamId));
		$('#table_df td:eq(' + (availableSeat-1) + ') .cell_player_team').css("color", "#"+getTeamInfo("lightColor", teamId));
	}
	else if( playerPosition == "MD" ) {
		$('#table_md td').eq(availableSeat-1).attr("data-playerId", playerId);
		$('#table_md td').eq(availableSeat-1).attr("data-teamId", teamId);
		$('#table_md td').eq(availableSeat-1).attr("data-nationZone", nationZone);
		$('#table_md td:eq(' + (availableSeat-1) + ') .cell_player_teambg').css("background-image", "url('"+getTeamInfo("background", teamId)+"')");
		$('#table_md td:eq(' + (availableSeat-1) + ') .cell_player_player').css("background-color", "#"+getTeamInfo("lightColor", teamId));
		$('#table_md td:eq(' + (availableSeat-1) + ') .cell_player_player').text(playerName);
		$('#table_md td:eq(' + (availableSeat-1) + ') .cell_player_team').css("background-color", "#"+getTeamInfo("darkColor", teamId));
		$('#table_md td:eq(' + (availableSeat-1) + ') .cell_player_team').text(teamName);
		$('#table_md td:eq(' + (availableSeat-1) + ') .cell_player_player').css("color", "#"+getTeamInfo("darkColor", teamId));
		$('#table_md td:eq(' + (availableSeat-1) + ') .cell_player_team').css("color", "#"+getTeamInfo("lightColor", teamId));
	}
	else if( playerPosition == "FW" ) {
		$('#table_fw td').eq(availableSeat-1).attr("data-playerId", playerId);
		$('#table_fw td').eq(availableSeat-1).attr("data-teamId", teamId);
		$('#table_fw td').eq(availableSeat-1).attr("data-nationZone", nationZone);
		$('#table_fw td:eq(' + (availableSeat-1) + ') .cell_player_teambg').css("background-image", "url('"+getTeamInfo("background", teamId)+"')");
		$('#table_fw td:eq(' + (availableSeat-1) + ') .cell_player_player').css("background-color", "#"+getTeamInfo("lightColor", teamId));
		$('#table_fw td:eq(' + (availableSeat-1) + ') .cell_player_player').text(playerName);
		$('#table_fw td:eq(' + (availableSeat-1) + ') .cell_player_team').css("background-color", "#"+getTeamInfo("darkColor", teamId));
		$('#table_fw td:eq(' + (availableSeat-1) + ') .cell_player_team').text(teamName);
		$('#table_fw td:eq(' + (availableSeat-1) + ') .cell_player_player').css("color", "#"+getTeamInfo("darkColor", teamId));
		$('#table_fw td:eq(' + (availableSeat-1) + ') .cell_player_team').css("color", "#"+getTeamInfo("lightColor", teamId));
	}
}

function onclickConfirmTeam() {
	
	/* Check is full team */
	players = getPlayerIn();
	for( i = 0; i < players.length; i++ ) {
		if( players[i].playerId == 0 ) {
			showModal('ยืนยันทีมไม่สำเร็จ', 'ทีมคุณยังมีนักเตะไม่ครบ 15 คน', false);
			return;
		}
	}

	sPlayerId = "";
	aPlayers = getPlayerIn();
	for( i = 0; i < aPlayers.length; i++ ) {
		if( i == 0 )
			sPlayerId = aPlayers[i].playerId;
		else
			sPlayerId = sPlayerId + "," + aPlayers[i].playerId;
	}
	
	$('#div_loading_2').show();
	$.ajax({
		url: "?r=Transfer/SavePlayers",
		data: {
			playerIds: sPlayerId,
		},
		type: 'POST',
		success: function(data){
			if( data == 1 ) {
				showModal('ยืนยันทีมสำเร็จ', 'บันทึกทีมของคุณเรียบร้อย', false);
				$('#div_loading_2').hide();
				$('#table_menu td:eq(2)').click();
			}
			else if( data == 6 ) {
				showModal('ยืนยันทีมไม่สำเร็จ', 'มีผู้เล่นเกินโควต้าอยู่ในทีมของคุณ', false);
				$('#div_loading_2').hide();
			}
			else {
				alert(data);
				$('#div_loading_2').hide();
			}
		},
		error: function(){
			alert('ERROR');
			$('#div_loading_2').hide();
		},
				        
	});
}

function getPlayerIn() {
	players = [];
	for( i = 0; i < $('#table_gk td').length; i++ ) {
		players.push({
			position: "GK",
			playerId: $('#table_gk td').eq(i).attr('data-playerId'),
			teamId: $('#table_gk td').eq(i).attr('data-teamId'),
			nationZone: $('#table_gk td').eq(i).attr('data-nationZone'),
			index: (i+1)
		});
	}

	for( i = 0; i < $('#table_df td').length; i++ ) {
		players.push({
			position: "DF",
			playerId: $('#table_df td').eq(i).attr('data-playerId'),
			teamId: $('#table_df td').eq(i).attr('data-teamId'),
			nationZone: $('#table_df td').eq(i).attr('data-nationZone'),
			index: (i+1)
		});
	}

	for( i = 0; i < $('#table_md td').length; i++ ) {
		players.push({
			position: "MD",
			playerId: $('#table_md td').eq(i).attr('data-playerId'),
			teamId: $('#table_md td').eq(i).attr('data-teamId'),
			nationZone: $('#table_md td').eq(i).attr('data-nationZone'),
			index: (i+1)
		});
	}

	for( i = 0; i < $('#table_fw td').length; i++ ) {
		players.push({
			position: "FW",
			playerId: $('#table_fw td').eq(i).attr('data-playerId'),
			teamId: $('#table_fw td').eq(i).attr('data-teamId'),
			nationZone: $('#table_fw td').eq(i).attr('data-nationZone'),
			index: (i+1)
		});
	}

	return players;
}

function getTeamInfo(type, teamId) {
	if( type == "background" ) {
		<?php 
			foreach( $aTeams as $aEachTeam ) {
		?>
			if( teamId == <?= $aEachTeam['id'] ?> ) return "images/<?= $aEachTeam['image_rectangle'] ?>";
		<?php 
			}
		?>
	}
	else if( type == "darkColor" ) {
		<?php 
			foreach( $aTeams as $aEachTeam ) {
		?>
			if( teamId == <?= $aEachTeam['id'] ?> ) return "<?= $aEachTeam['color_dark'] ?>";
		<?php 
			}
		?>
	}
	else if( type == "lightColor" ) {
		<?php 
			foreach( $aTeams as $aEachTeam ) {
		?>
			if( teamId == <?= $aEachTeam['id'] ?> ) return "<?= $aEachTeam['color_light'] ?>";
		<?php 
			}
		?>
	}
}

function onclickResetTeam() {
	if( $('#span_reset_quota').text() == "0" )
		showModal("ไม่สามารถรีเซ็ตทีมได้", "ไม่มีโควต้ารีเซ็ตทีมเหลือแล้ว ไม่สามารถรีเซ็ตทีมได้", isSmall);
	else
		$('#modal_confirm_reset').modal('show');
}

function onclickConfirmResetTeam() {
	$('#div_loading_2').show();
	$.ajax({
		url: "?r=Transfer/ResetTeam",
		data: {},
		type: 'POST',
		success: function(data){
			if( data == 1 ) {
				$('#div_loading_2').hide();
				$('#span_move_quota').html('ไม่อั้น');
				$('#span_reset_quota').html( ($('#span_reset_quota').text() - 1) );
				$('#btn_reset_team').attr('disabled', true);
				clearAllPlayer();
			}
			else {
				alert('ERROR');
				$('#div_loading_2').hide();
			}
		},
		error: function(){
			alert('ERROR');
			$('#div_loading_2').hide();
		},		        
	});
}

function clearAllPlayer() {

	$('#table_gk td, #table_df td, #table_md td, #table_fw td').attr("data-playerId", "0");
	$('#table_gk td, #table_df td, #table_md td, #table_fw td').attr("data-teamId", "0");
	$('#table_gk td, #table_df td, #table_md td, #table_fw td').attr("data-nationZone", "THAI");
	$('#table_gk td, #table_df td, #table_md td, #table_fw td').html( $('#temp_table_player_out td').html() );
}

</script>