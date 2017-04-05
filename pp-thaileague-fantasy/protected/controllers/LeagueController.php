<?php

class LeagueController extends Controller
{
	public function actionIndex() {
		echo 'nothing';
	}
	
	public function actionGetLeagueMember( $iGroupId ) {
		
		$iUserId = Helpers::getUserId($_COOKIE['ppfantasy_username']);
		
		/* Get All Members */
		$sSqlStatement = "SELECT UM.place AS place, UM.user_id AS user_id, U.username AS username,
				UM.total_point AS total_point, UM.latest_week_point AS latest_week_point
			FROM `user_group_member` UM JOIN `user` U ON UM.user_id = U.id
			WHERE UM.status = 1 AND UM.deleted = 0 AND UM.user_group_id = :groupId
			ORDER BY UM.place ASC";
		$aMember = Yii::app()->db->createCommand($sSqlStatement)
			->bindValues([
					':groupId' => $iGroupId,
			])
			->queryAll();
		
		/* Get User Place */
		$iFoundIndex = -1;
		for( $i = 0; $i < count($aMember); $i++ ) {
			if( $aMember[$i]['user_id'] == $iUserId )
				$iFoundIndex = $i;
		}
		
		/* New Result */
		$aResult = array();
		$aResult['all_member'] = $aMember;
		$aResult['user'] = $aMember[$iFoundIndex];
		
		echo json_encode($aResult);
	}
	
	public function actionJoinGroup() {
		
		$sPassword = $_POST['password'];
		$iUserId = Helpers::getUserId($_COOKIE['ppfantasy_username']);
		
		/* Check Username & Password */
		if( !Helpers::checkAuthentication($_COOKIE['ppfantasy_username'], $_COOKIE['ppfantasy_password']) ) {
			echo 2;
			return;
		}
		
		/* Check Password */
		$sSqlStatement = "SELECT id, name
			FROM `user_group`
			WHERE status = 1 AND deleted = 0 AND password = :password";
		
		$aCheckPassword = Yii::app()->db->createCommand($sSqlStatement)
			->bindValues([
					':password' => $sPassword,
			])
			->queryAll();
			
		if( count($aCheckPassword) == 0 ) {
			echo 'no_group';
			return;
		}
		
		/* Check Is User Already in Group */
		$iGroupId = $aCheckPassword[0]['id'];
		$sGroupName = $aCheckPassword[0]['name'];
		$sSqlStatement = "SELECT id
			FROM `user_group_member`
			WHERE status = 1 AND deleted = 0 AND user_group_id = $iGroupId AND user_id = $iUserId";
		$aCheckAlreadyInGroup = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		if( count($aCheckAlreadyInGroup) > 0 ) {
			echo 'already_in';
			return;
		}
		
		/* Check 50 members in group */
		$sSqlStatement = "SELECT id
			FROM `user_group_member`
			WHERE status = 1 AND deleted = 0 AND user_group_id = $iGroupId";
		$aTotalMember = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		if( count($aTotalMember) >= 50 ) {
			echo 'member_full';
			return;
		}
		
		/* Add User to Group */
		$sSqlStatement = "SELECT COUNT(id) AS total_member
			FROM `user_group_member`
			WHERE status = 1 AND deleted = 0 AND user_group_id = $iGroupId";
		$iTotalMember = Yii::app()->db->createCommand($sSqlStatement)->queryAll()[0]['total_member'];
		
		$model = new UserGroupMember();
		$model->user_group_id = $iGroupId;
		$model->user_id = $iUserId;
		$model->place = $iTotalMember + 1;
		$model->created_date = Helpers::getCurrentTime();
		$model->created_by = $iUserId;
		$model->save();
		
		echo "$iGroupId,$sGroupName";
	}
	
	public function actionCreateGroup() {
		
		$sGroupName = $_POST['groupName'];
		$iUserId = Helpers::getUserId($_COOKIE['ppfantasy_username']);
		
		/* Check Username & Password */
		if( !Helpers::checkAuthentication($_COOKIE['ppfantasy_username'], $_COOKIE['ppfantasy_password']) ) {
			echo 2;
			return;
		}
		
		/* Check Existing Group's Name */
		$sSqlStatement = "SELECT id
			FROM `user_group`
			WHERE status = 1 AND deleted = 0 AND name = :groupName";
		$aCheckGroupName = Yii::app()->db->createCommand($sSqlStatement)
			->bindValues([
					':groupName' => $sGroupName,
			])
			->queryAll();
		
		if( count($aCheckGroupName) > 0 ) {
			echo 'exist_name';
			return;
		}
		
		/* Check Is 5 Groups */
		$sSqlStatement = "SELECT COUNT(id) AS total_group
			FROM `user_group`
			WHERE status = 1 AND deleted = 0 AND owner_user_id = $iUserId";
		$iTotalGroups = Yii::app()->db->createCommand($sSqlStatement)->queryAll()[0]['total_group'];
		
		if( $iTotalGroups == 5 ) {
			echo 'full_group';
			return;
		}
		
		/* Create Group */
		$model = new UserGroup();
		$model->name = $sGroupName;
		$model->owner_user_id = $iUserId;
		$model->password = 1234;
		$model->start_week_id = Helpers::getConfigValue('latest_week');
		$model->created_date = Helpers::getCurrentTime();
		$model->created_by = $iUserId;
		$model->save();
		
		$iGroupId = $model->id;
		$sPassword = $iGroupId . substr(sha1($iGroupId), 0, 5);
		
		UserGroup::model()->updateByPk( $iGroupId, array(
				'password' => $sPassword,
		) );
		
		$model = new UserGroupMember();
		$model->user_group_id = $iGroupId;
		$model->user_id = $iUserId;
		$model->place = 1;
		$model->created_date = Helpers::getCurrentTime();
		$model->created_by = $iUserId;
		$model->save();
		
		echo $iGroupId;
	}
	
	public function actionGetGroupPassword() {
		
		$iGroupId = $_POST['groupId'];
		$iUserId = Helpers::getUserId($_COOKIE['ppfantasy_username']);
		
		/* Check Username & Password */
		if( !Helpers::checkAuthentication($_COOKIE['ppfantasy_username'], $_COOKIE['ppfantasy_password']) ) {
			echo 'ERROR';
			return;
		}
		
		/* Get Password */
		$sSqlStatement = "SELECT password
			FROM `user_group`
			WHERE id = :groupId AND owner_user_id = :ownerId";
		$aPassword = Yii::app()->db->createCommand($sSqlStatement)
			->bindValues([
					':groupId' => $iGroupId,
					':ownerId' => $iUserId,
			])
			->queryAll();
			
		echo isset($aPassword[0]['password']) ? $aPassword[0]['password'] : 'ERROR';
	}
	
	public function actionDeleteGroup() {
		
		$iGroupId = intval($_POST['groupId']);
		$iUserId = Helpers::getUserId($_COOKIE['ppfantasy_username']);
		$sCurrentTime = Helpers::getCurrentTime();
		
		/* Check Username & Password */
		if( !Helpers::checkAuthentication($_COOKIE['ppfantasy_username'], $_COOKIE['ppfantasy_password']) ) {
			echo 'ERROR';
			return;
		}
		
		/* Delete User_Group */
		$sSqlStatement = "UPDATE `user_group` 
			SET deleted = 1,
				modified_date = :currentDate,
				modified_by = :user
			WHERE id = :groupId";
		Yii::app()->db->createCommand($sSqlStatement)
			->bindValues([
					':currentDate' => $sCurrentTime,
					':user' => $iUserId,
					':groupId' => $iGroupId,
			])
			->execute();
			
		/* Delete User_Group_Member */
		$sSqlStatement = "UPDATE `user_group_member`
			SET deleted = 1,
				modified_date = :currentDate,
				modified_by = :user
			WHERE user_group_id = :groupId";
		Yii::app()->db->createCommand($sSqlStatement)
			->bindValues([
					':currentDate' => $sCurrentTime,
					':user' => $iUserId,
					':groupId' => $iGroupId,
			])
			->execute();
			
		echo 1;
	}
}