<?php

class PickTeamController extends Controller
{
	public function actionIndex() {
		echo 'cannot access';
	}
	
	public function actionSaveMyXI() {
		
		/* Get Timeout */
		$sTimeout = Helpers::getConfigValue('next_timeout');
		$sCurrent = Helpers::getCurrentTime();
		$iTimeoutStamp = strtotime($sTimeout);
		$iCurrentStamp = strtotime($sCurrent);
		
		if( $iCurrentStamp > $iTimeoutStamp ) {
			echo 100;
			return;
		}
		
		$sUsername = $_COOKIE['ppfantasy_username'];
		$sPassword = $_COOKIE['ppfantasy_password'];
		$aPlayerIds = explode(",", $_POST['playerIds']);
		$iCaptainIndex = $_POST['captain_index'];
		$iUserId = Helpers::getUserId($sUsername);
		$iLatestWeek = Helpers::getConfigValue('latest_week');
		
		/* Check Username & Password */
		if( !Helpers::checkAuthentication($sUsername, $sPassword) ) {
			echo 2;
			return;
		}
		
		/* Check is Player Id a number */
		foreach( $aPlayerIds as $iEachId ) {
			if( intval($iEachId) == 0 ) {
				echo 3;
				return;
			}
		}
		
		/* Check 15 Players */
		if( count($aPlayerIds) != 15 ) {
			echo 4;
			return;
		}
		
		/* Check if the same 15 players */
		$sSqlStatement = "SELECT XI.player_id AS player_id, P.player_position_id AS position
			FROM `user_my_xi` XI JOIN `player` P ON XI.player_id = P.id
			WHERE XI.status = 1 AND XI.deleted = 0 AND XI.user_id = $iUserId AND XI.week_id = $iLatestWeek";
		
		$aPlayers = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		$aOldPlayerId = array();
		for( $i = 0; $i < count($aPlayers); $i++ ) {
			$aOldPlayerId[$i] = $aPlayers[$i]['player_id'];
		}
		
		if( count( array_diff($aPlayerIds, $aOldPlayerId) ) != 0 ) {
			echo 5;
			return;
		}
		
		/* Check each position quota */
		$aGk = array();
		$aDf = array();
		$aMd = array();
		$aFw = array();
		for( $i = 0; $i < 11; $i++ ) {
			for( $j = 0; $j < count($aPlayers); $j++ ) {
				if( $aPlayerIds[$i] == $aPlayers[$j]['player_id'] ) {
					$iPosition = $aPlayers[$j]['position'];
					break;
				}
			}
			if( $iPosition == 1 )		$aGk[count($aGk)] = $aPlayerIds[$i];
			else if( $iPosition == 2 )	$aDf[count($aDf)] = $aPlayerIds[$i];
			else if( $iPosition == 3 )	$aMd[count($aMd)] = $aPlayerIds[$i];
			else if( $iPosition == 4 )	$aFw[count($aFw)] = $aPlayerIds[$i];
		}
		if( count($aGk) != 1 ) {
			echo 6;
			return;
		}
		if( count($aDf) < 3 || count($aDf) > 5 ) {
			echo 6;
			return;
		}
		if( count($aMd) < 2 || count($aMd) > 5 ) {
			echo 6;
			return;
		}
		if( count($aFw) < 1 || count($aFw) > 3 ) {
			echo 6;
			return;
		}
		
		/* Save Team */
		$sSqlStatement = "UPDATE `user_my_xi` SET deleted = 1 WHERE status = 1 AND deleted = 0 AND user_id = $iUserId AND week_id = $iLatestWeek";
		Yii::app()->db->createCommand($sSqlStatement)->execute();
		
		for( $i = 0; $i < count($aPlayerIds); $i++ ) {
			$model = new UserMyXi();
			$model->user_id = $iUserId;
			$model->player_id = $aPlayerIds[$i];
			$model->in_11 = $i < 11 ? 1 : 0;
			$model->sub = $i >= 11 ? 1 : 0;
			$model->captain = $i == $iCaptainIndex ? 1 : 0;
			$model->week_id = $iLatestWeek;
			$model->created_date = Helpers::getCurrentTime();
			if( !$model->save() ) {
				echo 7;
				return;
			}
		}
		
		echo 1;
	}
}
