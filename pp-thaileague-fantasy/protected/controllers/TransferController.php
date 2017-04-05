<?php

class TransferController extends Controller
{
	
	public function actionGetPlayers( $iPosition, $iSort, $iTeamId, $sKeyword ) {
		
		$sSqlCondition_Position = $iPosition == 0 ? "" : "AND P.player_position_id = :positionId";
		$sSqlCondition_Team = $iTeamId == 0 ? "" : "AND P.current_club_id = :teamId";
		$sSqlCondition_Keyword = "AND (P.name_th LIKE :keyword OR P.surname_th LIKE :keyword 
				OR P.name_en LIKE :keyword OR P.surname_en LIKE :keyword 
				OR P.called_name_th LIKE :keyword OR P.called_name_en LIKE :keyword)";
		
		if( $iSort == 1 )
			$sSqlCondition_Sort = "ORDER BY P.name_th ASC";
		else if( $iSort == 2 )
			$sSqlCondition_Sort = "ORDER BY PTP.total_point DESC";
		else
			$sSqlCondition_Sort = "ORDER BY PTP.last_5_weeks_point DESC";
		
		$sSqlStatement = "SELECT P.id AS player_id, 
					P.name_th AS name_th, 
					P.surname_th AS surname_th, 
					P.called_name_th AS called_name_th, 
					P.nation_id AS nation_id, 
					P.player_position_id AS position_id, 
					N.zone AS nation_zone,
					P.current_club_id AS team_id, 
					C.short_name_th AS team_name,
					PTP.total_point AS last_week_point,
					PTP.last_5_weeks_point AS last_5_weeks_point
				FROM `player` P
					JOIN `club` C ON P.current_club_id = C.id
					JOIN `nation` N ON P.nation_id = N.id
					JOIN `player_total_point` PTP ON P.id = PTP.player_id
				WHERE P.status = 1 AND P.deleted = 0 AND P.current_club_id <> 0 $sSqlCondition_Position $sSqlCondition_Team $sSqlCondition_Keyword
				$sSqlCondition_Sort
				LIMIT 100";
		
		$aPlayers = Yii::app()->db->createCommand($sSqlStatement)
			->bindValues([
					':positionId' => $iPosition,
					':teamId' => $iTeamId,
					':keyword' => "%$sKeyword%",
			])->queryAll();
			
		echo json_encode($aPlayers);
	}
	
	public function actionSavePlayers() {
		
		/* Get Timeout */
		$sTimeout = Helpers::getConfigValue('next_timeout');
		$sCurrent = Helpers::getCurrentTime();
		$iTimeoutStamp = strtotime($sTimeout);
		$iCurrentStamp = strtotime($sCurrent);
		
		if( $iCurrentStamp > $iTimeoutStamp ) {
			echo 100;
			return;
		}
		
		/* Inputs */
		$sUsername = $_COOKIE['ppfantasy_username'];
		$sPassword = $_COOKIE['ppfantasy_password'];
		$aPlayerIds = explode(",", $_POST['playerIds']);
		$iUserId = Helpers::getUserId($sUsername);
		
		foreach( $aPlayerIds as $iEachId ) {
			if( intval($iEachId) == 0 ) {
				echo 2;
				return;
			}
		}
		
		/* Check Username & Password */
		if( !Helpers::checkAuthentication($sUsername, $sPassword) ) {
			echo 3;
			return;
		}
		
		/* Check 15 Players */
		if( count($aPlayerIds) != 15 ) {
			echo 5;
			return;
		}
		
		/* Check 2 players in the same team */
		$aTeamIds = array();
		for( $i = 0; $i < count($aPlayerIds); $i++ ) {
			$oPlayer = Player::model()->findByPk($aPlayerIds[$i]);
			if( !$oPlayer ) {
				echo 6;
				return;
			}
			$aTeamIds[$i] = $oPlayer->current_club_id;
		}
		if( count( array_unique($aTeamIds) ) < 8 ) {
			echo 6;
			return;
		}

		/* Check Foreigner */
		$iCountAfc = 0;
		$iCountForeigner = 0;
		foreach( $aPlayerIds as $iEachPlayerId ) {
			$oPlayer = Player::model()->findByPk($iEachPlayerId);
			$oNation = Nation::model()->findByPk($oPlayer->nation_id);
			if( $oNation->id != 189 && $oNation->zone == "AFC" )
				$iCountAfc++;
			else if( $oNation->zone != "AFC" )
				$iCountForeigner++;
		}
		if( $iCountAfc + $iCountForeigner > 4 ) {
			echo 7;
			return;
		}
		if( $iCountForeigner > 3 ) {
			echo 8;
			return;
		}
		
		/* Check Quota and point reduced */
		$sSqlStatement = "SELECT week_move_left FROM `user_move_quota` WHERE status = 1 AND deleted = 0 AND user_id = $iUserId";
		$aQuota = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		$iQuota = $aQuota[0]['week_move_left'];
		
		$iPointReduced = 0;
		if( $iQuota != 15 ) {
			
			$sSqlStatement = "SELECT player_id FROM `user_my_team` WHERE status = 1 AND deleted = 0 AND user_id = $iUserId";
			$aOldPlayerQuery = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
			$aOldPlayer = array();
			for( $i = 0; $i < count($aOldPlayerQuery); $i++ )
				$aOldPlayer[$i] = $aOldPlayerQuery[$i]['player_id'];
			
			$iTotalPlayerDiff = count(array_diff($aPlayerIds, $aOldPlayer));
			$iRemainQuota = $iQuota - $iTotalPlayerDiff;
			$iPointReduced = $iRemainQuota < 0 ? $iRemainQuota * -4 : 0;
			
			$sSqlStatement = "SELECT minus_point FROM `user` WHERE status = 1 AND deleted = 0 AND id = $iUserId";
			$iOldMinusPoint = Yii::app()->db->createCommand($sSqlStatement)->queryAll()[0]['minus_point'];
			
			if( $iQuota != 0 ) {
				$iRemainQuota = $iRemainQuota < 0 ? 0 : $iRemainQuota;
				$sSqlStatement = "UPDATE `user_move_quota` 
					SET week_move_left = $iRemainQuota 
					WHERE status = 1 AND deleted = 0 AND user_id = $iUserId";
				Yii::app()->db->createCommand($sSqlStatement)->execute();
			}
			
			$iNewMinusPoint = $iOldMinusPoint + $iPointReduced;
			$sSqlStatement = "UPDATE `user` SET minus_point = $iNewMinusPoint WHERE status = 1 AND deleted = 0 AND id = $iUserId";
			Yii::app()->db->createCommand($sSqlStatement)->execute();
		}
		
		/* Delete the old ones */
		$sSqlStatement = "UPDATE `user_my_team` SET deleted = 1 
				WHERE status = 1 AND deleted = 0 AND user_id = $iUserId";
		
		Yii::app()->db->createCommand($sSqlStatement)->execute();
		
		/* Add the new ones */
		foreach( $aPlayerIds as $iEachPlayerId ) {
			$model = new UserMyTeam();
			$model->user_id = $iUserId;
			$model->player_id = $iEachPlayerId;
			$model->created_date = Helpers::getCurrentTime();
			$model->created_by = $iUserId;
			if( !$model->save() ) {
				echo 9;
				return;
			}
		}
		
		/* Save to UserMyXi */
		$iLatestWeek = Helpers::getConfigValue('latest_week');
		
		$sSqlStatement = "UPDATE `user_my_xi` SET deleted = 1 WHERE status = 1 AND deleted = 0 AND user_id = $iUserId AND week_id = $iLatestWeek";
		Yii::app()->db->createCommand($sSqlStatement)->execute();
		
		for( $i = 0; $i < count($aPlayerIds); $i++ ) {
			$model = new UserMyXi();
			$model->user_id = $iUserId;
			$model->player_id = $aPlayerIds[$i];
			if( in_array($i, array(0, 2, 3, 4, 5, 7, 8, 9, 12, 13, 14)) ) {
				$model->in_11 = 1;
				$model->sub = 0;
			}
			else {
				$model->in_11 = 0;
				$model->sub = 1;
			}
			$model->captain = $i == 0 ? 1 : 0;
			$model->week_id = $iLatestWeek;
			$model->created_date = Helpers::getCurrentTime();
			$model->created_by = $iUserId;
			if( !$model->save() ) {
				echo 10;
				return;
			}
		}
		
		/* Reduce point on latest week */
		if( $iPointReduced != 0 ) {
			$sSqlStatement = "SELECT minus_point FROM `user_minus_point` 
				WHERE status = 1 AND deleted = 0 AND user_id = $iUserId AND week_id = $iLatestWeek";
			$aOldWeekMinusPoint = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
			
			if( count($aOldWeekMinusPoint) == 0 ) {
				$model_minus_point = new UserMinusPoint();
				$model_minus_point->user_id = $iUserId;
				$model_minus_point->week_id = $iLatestWeek;
				$model_minus_point->minus_point = $iPointReduced;
				$model_minus_point->created_date = Helpers::getCurrentTime();
				$model_minus_point->created_by = $iUserId;
				$model_minus_point->save();
			}
			else {
				$iNewWeekMinusPoint = $aOldWeekMinusPoint[0]['minus_point'] + $iPointReduced;
				$sSqlStatement = "UPDATE `user_minus_point` 
					SET minus_point = $iNewWeekMinusPoint 
					WHERE status = 1 AND deleted = 0 AND user_id = $iUserId AND week_id = $iLatestWeek";
				Yii::app()->db->createCommand($sSqlStatement)->execute();
			}
		}

		echo 1;
	}
	
	public function actionResetTeam() {
		
		/* Get Timeout */
		$sTimeout = Helpers::getConfigValue('next_timeout');
		$sCurrent = Helpers::getCurrentTime();
		$iTimeoutStamp = strtotime($sTimeout);
		$iCurrentStamp = strtotime($sCurrent);
		
		if( $iCurrentStamp > $iTimeoutStamp ) {
			echo 100;
			return;
		}
		
		/* Inputs */
		$sUsername = $_COOKIE['ppfantasy_username'];
		$sPassword = $_COOKIE['ppfantasy_password'];
		$iUserId = Helpers::getUserId($sUsername);
		$iLatestWeek = Helpers::getConfigValue('latest_week');
		
		/* Check Username & Password */
		if( !Helpers::checkAuthentication($sUsername, $sPassword) ) {
			echo 3;
			return;
		}
		
		/* Get current reset quota */
		$sSqlStatement = "SELECT reset_move_left FROM `user_move_quota` WHERE status = 1 AND deleted = 0 AND user_id = $iUserId";
		$iResetQuota = Yii::app()->db->createCommand($sSqlStatement)->queryAll()[0]['reset_move_left'];
		if( $iResetQuota == 0 ) {
			echo 2;
			return;
		}
		$iNewResetQuota = $iResetQuota - 1;
		$sSqlStatement = "UPDATE `user_move_quota` SET week_move_left = 15, reset_move_left = $iNewResetQuota WHERE status = 1 AND deleted = 0 AND user_id = $iUserId";
		Yii::app()->db->createCommand($sSqlStatement)->execute();
		
		/* Clear My Team */
		/*
		$sSqlStatement = "UPDATE `user_my_team` SET deleted = 1 WHERE status = 1 AND deleted = 0 AND user_id = $iUserId";
		Yii::app()->db->createCommand($sSqlStatement)->execute();
		
		$sSqlStatement = "UPDATE `user_my_xi` 
			SET deleted = 1 
			WHERE status = 1 AND deleted = 0 AND user_id = $iUserId AND week_id = $iLatestWeek";
		Yii::app()->db->createCommand($sSqlStatement)->execute();
		*/
		echo 1;
	}

}
