<style>

.text_head {
	text-align: center;
	font-size: 26px;
}

#table_league_user th {
	text-align: center;
	color: white;
}

#table_league_user td:nth-child(1),
#table_league_user td:nth-child(3),
#table_league_user td:nth-child(4) {
	text-align: center;
}

.bg_text_head {
	padding: 5px 40px;
	background-color: #D2D2D2;
	border-radius: 5px;
}

</style>

<table style="width: 100%;">
<tr>

<td valign="top" style="width: 50%; padding: 20px;">

	<p class="text_head">
		<span class="bg_text_head" style="background-color: #B31F24; color: white;">กลุ่มของฉัน</span>
	</p>
	<div style="text-align: center; margin-top: 30px;">
		<div class="btn-group">
			<button type="button" class="btn btn-warning" onclick="onclickJoinGroupModal()">เข้ากลุ่ม</button>
	  		<button type="button" class="btn btn-success" onclick="onclickCreateGroupModal()">สร้างกลุ่ม</button>
		</div>
	</div>
	<div style="height: 450px; overflow-y: auto;">
		<table id="table_list_group" class="table" style="width: 100%; margin-top: 20px;">
		<tbody>
			<tr>
				<td style="width: 15%; text-align: center;">
					<button type="button" class="btn btn-info" onclick="showWorldRanking()">ชมกลุ่ม</button>
				</td>
				<td style="font-size: 18px;">ทั่วโลก</td>
				<td style="width: 20%; text-align: center;"></td>
			</tr>
			<!-- 
			<tr>
				<td style="width: 15%; text-align: center;">
					<button type="button" class="btn btn-info">ชมลีก</button>
				</td>
				<td style="font-size: 18px;">Toyota Thai Premier League</td>
				<td style="width: 20%; text-align: center;">
					<button type="button" class="btn btn-primary" onclick="$('#modal_group_detail').modal('show')">จัดการกลุ่ม</button>
				</td>
			</tr>
			<tr>
				<td style="width: 15%; text-align: center;">
					<button type="button" class="btn btn-info">ชมลีก</button>
				</td>
				<td style="font-size: 18px;">Toyota Thai Premier League</td>
				<td style="width: 20%; text-align: center;"></td>
			</tr>
			-->
			<?php 
				foreach( $aMyGroup as $aEachGroup ) {
			?>
				<tr data-groupId="<?= $aEachGroup['group_id'] ?>">
					<td style="width: 15%; text-align: center;">
						<button type="button" class="btn btn-info" onclick="onclickShowMemberInGroup(<?= $aEachGroup['group_id'] ?>, '<?= $aEachGroup['group_name'] ?>')">ชมกลุ่ม</button>
					</td>
					<td style="font-size: 18px;"><?= $aEachGroup['group_name'] ?></td>
					<td style="width: 20%; text-align: center;">
						<?php
							if( $aEachGroup['is_group_owner'] == 1 ) {
						?>
							<button type="button" class="btn btn-primary" onclick="onclickGroupDetailModal(<?= $aEachGroup['group_id'] ?>)">จัดการกลุ่ม</button>
						<?php
							}
						?>
					</td>
				</tr>
			<?php 
				}
			?>
		</tbody>
		</table>
	</div>
</td>

<td valign="top" style="width: 50%; padding: 30px; border: 1px solid #e6e6e6; background-color: #B31F24;">

	<p class="text_head">
		<span id="text_group_name" class="bg_text_head" style="background-color: white;">ทั่วโลก</span>
	</p>
	<div style="height: 450px; overflow-y: auto;">
		<table id="table_league_user" class="table" style="width: 100%; margin-top: 20px; color: white;">
			<thead>
				<tr>
					<th style="width: 10%;">อันดับ</th>
					<th>Username</th>
					<th style="width: 18%;">คะแนนสัปดาห์ล่าสุด</th>
					<th style="width: 18%;">คะแนนรวม</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>1</td>
					<td>Piyawach</td>
					<td>2</td>
					<td>4</td>
				</tr>
			</tbody>
		</table>
	</div>
	<table id="table_current_user_place" class="table" style="width: 100%; margin-top: 20px; color: white;">
		<tbody>
			<tr>
				<td style="width: 10%; text-align: center;">1</td>
				<td>Piyawach</td>
				<td style="width: 18%; text-align: center;">2</td>
				<td style="width: 18%; text-align: center;">4</td>
			</tr>
		</tbody>
	</table>
</td>

</tr>
</table>

<!-- Modal Join Group -->
<div id="modal_group_join" class="modal fade" role="dialog">
	<div class="modal-dialog">

		<!-- Modal content-->
		<div class="modal-content">
			<div class="modal-header" style="background-color: #B31F24;">
				<h4 class="modal-title" style="color: white; font-size: 25px;">เข้ากลุ่ม</h4>
			</div>
			<div class="modal-body">
				<p style="font-size: 18px;">ใส่รหัสกลุ่ม</p>
				<input id="in_group_password" type="text" style="font-size: 22px; color: black;">
				<img id="img_load_join_group" src="images/loading.gif" style="width: 40px; margin-left: 10px;">
				<span id="text_group_notfound">ไม่พบรหัสกลุ่ม</span>
				<span id="text_group_joined" style="color: #5DD21E;">เข้ากลุ่มเรียบร้อย</span>
				<span id="text_group_already">คุณอยู่ในกลุ่มนี้แล้ว</span>
				<span id="text_group_full">กลุ่มนี้เต็มแล้ว</span>
				<br><br>
				<button type="button" class="btn btn-warning" onclick="onclickJoinGroup()">เข้ากลุ่ม</button>
			</div>
			<div class="modal-footer" style="background-color: #B31F24;">
				<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
			</div>
		</div>

	</div>
</div>

<!-- Modal Create Group -->
<div id="modal_group_create" class="modal fade" role="dialog">
	<div class="modal-dialog">

		<!-- Modal content-->
		<div class="modal-content">
			<div class="modal-header" style="background-color: #B31F24;">
				<h4 class="modal-title" style="color: white; font-size: 25px;">สร้างกลุ่ม</h4>
			</div>
			<div class="modal-body">
				<p style="font-size: 18px;">ใส่ชื่อกลุ่ม</p>
				<input id="in_group_name" type="text" style="font-size: 22px; color: black;">
				<img id="img_load_create_group" src="images/loading.gif" style="width: 40px; margin-left: 10px;">
				<span id="text_group_exist">ชื่อกลุ่มซ้ำ</span>
				<span id="text_group_created" style="color: #5DD21E;">สร้างกลุ่มเรียบร้อย</span>
				<span id="text_group_five">คุณสร้างกลุ่มครบ 5 กลุ่มแล้ว</span>
				<br><br>
				<button type="button" class="btn btn-warning" onclick="onclickCreateGroup()">สร้างกลุ่ม</button>
			</div>
			<div class="modal-footer" style="background-color: #B31F24;">
				<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
			</div>
		</div>

	</div>
</div>

<!-- Modal Group Detail -->
<div id="modal_group_detail" class="modal fade" role="dialog">
	<div class="modal-dialog">

		<!-- Modal content-->
		<div class="modal-content">
			<div class="modal-header" style="background-color: #B31F24;">
				<h4 class="modal-title" style="color: white; font-size: 25px;">กลุ่มพีพีแอนด์ฮิสเฟรนด์</h4>
			</div>
			<div class="modal-body">
				<p style="font-size: 18px; font-weight: bold; text-align: center;">รหัสกลุ่ม</p>
				<p id="text_group_password" style="font-size: 50px; text-align: center;">0e0f051g</p>
				<br><br>
				<div style="text-align: center;">
					<button type="button" class="btn btn-danger" onclick="onclickDeleteGroup()">ลบกลุ่ม</button>
				</div>
			</div>
			<div class="modal-footer" style="background-color: #B31F24;">
				<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
			</div>
		</div>

	</div>
</div>

<input id="hid_current_group" type="hidden">

<script>

var bJoiningGroup = false;
var bCreatingGroup = false;

$(document).ready(function(){

	showWorldRanking();
});

function showMemberInGroup(oMember, oUser) {

	// oMember[index].detail
	// detail: place, name, totalPoint, lastWeekPoint
	// oUser: the same as oMember

	$('#table_league_user tbody').empty();
	for( i = 0; i < oMember.length; i++ ) {
		sHtml = '<tr><td>' + oMember[i].place +
			'</td><td>' + oMember[i].name +
			'</td><td>' + oMember[i].lastWeekPoint +
			'</td><td>' + oMember[i].totalPoint +
			'</td></tr>';

		$('#table_league_user tbody').append(sHtml);
	}

	$('#table_current_user_place td:eq(0)').text(oUser.place);
	$('#table_current_user_place td:eq(1)').text(oUser.name);
	$('#table_current_user_place td:eq(2)').text(oUser.lastWeekPoint);
	$('#table_current_user_place td:eq(3)').text(oUser.totalPoint);
}

function showWorldRanking() {

	$('#text_group_name').text('ทั่วโลก');
	
	oMember = [];
	<?php 
		foreach( $aWorldRank as $aEachRank ) {
	?>
		oMember.push({
			place: <?= $aEachRank['place'] ?>,
			name: "<?= $aEachRank['username'] ?>",
			totalPoint: <?= $aEachRank['total_point'] ?>,
			lastWeekPoint: <?= $aEachRank['last_week_point'] ?>
		});
	<?php 
		}
	?>

	oUser = {
		place: <?= isset($aUserRank[0]['place']) ? $aUserRank[0]['place'] : 0 ?>,
		name: "<?= $_COOKIE['ppfantasy_username'] ?>",
		totalPoint: <?= isset($aUserRank[0]['total_point']) ? $aUserRank[0]['total_point'] : 0 ?>,
		lastWeekPoint: <?= isset($aUserRank[0]['last_week_point']) ? $aUserRank[0]['last_week_point'] : 0 ?>
	};

	showMemberInGroup(oMember, oUser);
}

function onclickShowMemberInGroup( iGroupId, sGroupName ) {
	
	$.ajax({
		url: "?r=League/GetLeagueMember",
		data: {
			iGroupId: iGroupId,
		},
		type: 'GET',
		dataType: 'JSON',
		success: function(data){
			
			oMember = [];
			for( i = 0; i < data.all_member.length; i++ ) {
				oMember.push({
					place: data.all_member[i].place,
					name: data.all_member[i].username,
					totalPoint: data.all_member[i].total_point,
					lastWeekPoint: data.all_member[i].latest_week_point
				});
			}

			oUser = {
				place: data.user.place,
				name: data.user.username,
				totalPoint: data.user.total_point,
				lastWeekPoint: data.user.latest_week_point
			};

			showMemberInGroup(oMember, oUser);

			$('#text_group_name').text(sGroupName);
		},
		error: function(){
			alert('ERROR');
		},	        
	});
}

function onclickJoinGroupModal() {

	$('#in_group_password').val('');
	$('#modal_group_join').modal('show');
	$('#img_load_join_group').hide();
	$('#text_group_notfound').hide();
	$('#text_group_joined').hide();
	$('#text_group_already').hide();
	$('#text_group_full').hide();
}

function onclickCreateGroupModal() {

	$('#in_group_name').val('');
	$('#modal_group_create').modal('show')
	$('#img_load_create_group').hide();
	$('#text_group_exist').hide();
	$('#text_group_created').hide();
	$('#text_group_five').hide();
}

function onclickGroupDetailModal( groupId ) {

	$('#modal_group_detail').modal('show');
	$('#hid_current_group').val(groupId);
	$.ajax({
		url: "?r=League/GetGroupPassword",
		data: {
			groupId: groupId,
		},
		type: 'POST',
		success: function(data){
			$('#text_group_password').text(data);
		},
		error: function(){
			$('#text_group_password').text('ERROR');
		},	        
	});
}

function onclickJoinGroup() {
	
	if( !bJoiningGroup ) {
		bJoiningGroup = true;
		$('#img_load_join_group').show();
		$('#text_group_notfound').hide();
		$('#text_group_joined').hide();
		$('#text_group_already').hide();
		$('#text_group_full').hide();
		$.ajax({
			url: "?r=League/JoinGroup",
			data: {
				password: $('#in_group_password').val(),
			},
			type: 'POST',
			success: function(data){
				$('#img_load_join_group').hide();
				if( data == 2 )
					alert('เข้าระบบผิดพลาด');
				else if( data == "no_group" )
					$('#text_group_notfound').show();
				else if( data == "already_in" )
					$('#text_group_already').show();
				else if( data == "member_full" )
					$('#text_group_full').show();
				else {
					groupId = data.split(",")[0];
					groupName = data.split(",")[1];
					addToGroupList(groupId, groupName, false);
					$('#text_group_joined').show();
				}
				
				bJoiningGroup = false;
			},
			error: function(){
				alert('ERROR');
				$('#img_load_join_group').hide();
				bJoiningGroup = false;
			},	        
		});
	}
}

function addToGroupList(groupId, groupName, isOwner) {

	sHtml_GroupName = "'" + groupName + "'";
	sHtml = '<tr data-groupId="'+groupId+'">' +
		'<td style="width: 15%; text-align: center;">' +
			'<button type="button" class="btn btn-info" onclick="onclickShowMemberInGroup('+groupId+','+sHtml_GroupName+')">ชมกลุ่ม</button>' +
		'</td>' +
		'<td style="font-size: 18px;">'+groupName+'</td>' +
		'<td style="width: 20%; text-align: center;">'+
		(isOwner ? '<button type="button" class="btn btn-primary" onclick="onclickGroupDetailModal('+groupId+')">จัดการกลุ่ม</button>' : '') +
		'</td>' +
		'</tr>';
	$('#table_list_group tbody').append(sHtml);
}

function onclickCreateGroup() {
	if( !bCreatingGroup ) {
		bCreatingGroup = true;
		$('#img_load_create_group').show();
		$('#text_group_exist').hide();
		$('#text_group_created').hide();
		$('#text_group_five').hide();
		$.ajax({
			url: "?r=League/CreateGroup",
			data: {
				groupName: $('#in_group_name').val(),
			},
			type: 'POST',
			success: function(data){
				$('#img_load_create_group').hide();
				bCreatingGroup = false;

				if( data == 2 )
					alert('เข้าระบบผิดพลาด');
				else if( data == "exist_name" )
					$('#text_group_exist').show();
				else if( data == "full_group" )
					$('#text_group_five').show();
				else {
					addToGroupList(data, $('#in_group_name').val(), true);
					$('#text_group_created').show();
				}
			},
			error: function(){
				alert('ERROR');
				$('#img_load_create_group').hide();
				bCreatingGroup = false;
			},	        
		});
	}
}

function onclickDeleteGroup() {
	$.ajax({
		url: "?r=League/DeleteGroup",
		data: {
			groupId: $('#hid_current_group').val(),
		},
		type: 'POST',
		success: function(data){
			if( data != 1 )
				alert('ERROR');
			else {
				$('#table_list_group tr[data-groupId="'+$('#hid_current_group').val()+'"]').remove();
				$('#modal_group_detail').modal('hide');
			}
		},
		error: function(){
			alert('ERROR');
		},	        
	});
}

</script>