<?php

class PointController extends Controller
{
	public function actionIndex() {
		echo 'cannot access';
	}
	
	public function actionRenderPointByWeek() {
		
		/* Inputs */
		$sUsername = $_COOKIE['ppfantasy_username'];
		$sPassword = $_COOKIE['ppfantasy_password'];
		$iWeekId = $_GET['week_id'];
		
		/* Check Username & Password */
		if( !Helpers::checkAuthentication($sUsername, $sPassword) ) {
			echo 0;
			return;
		}
		
		/* Check if WeekId is integer */
		if( intval($iWeekId) == 0 ) {
			echo 0;
			return;
		}
		
		$iUserId = Helpers::getUserId($sUsername);
		$sSqlStatement = "SELECT C.image_rectangle AS team_bg, C.color_light AS color_light, C.color_dark AS color_dark,
				P.called_name_th AS player_name, XI.point AS point, XI.in_11 AS in_11, XI.sub AS sub, XI.captain AS captain,
				P.player_position_id AS position_id, P.id AS player_id
			FROM `user_my_xi` XI
				JOIN `player` P ON XI.player_id = P.id
				JOIN `club` C ON P.current_club_id = C.id
			WHERE XI.status = 1 AND XI.deleted = 0 AND XI.user_id = $iUserId AND XI.week_id = $iWeekId";
		$aPlayers = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		$aPlayerGk = array();
		$aPlayerDf = array();
		$aPlayerMd = array();
		$aPlayerFw = array();
		$aPlayerGkSub = array();
		$aPlayerSub = array();
		
		$iTotalWeekPoint = 0;
		
		foreach( $aPlayers as $aEachPlayer ) {
			if( $aEachPlayer['position_id'] == 1 && $aEachPlayer['in_11'] == 1 ) {
				$aPlayerGk['team_bg'] = $aEachPlayer['team_bg'];
				$aPlayerGk['color_light'] = $aEachPlayer['color_light'];
				$aPlayerGk['color_dark'] = $aEachPlayer['color_dark'];
				$aPlayerGk['player_name'] = $aEachPlayer['player_name'];
				$aPlayerGk['point'] = $aEachPlayer['point'];
				$aPlayerGk['is_captain'] = $aEachPlayer['captain'] == 1;
				$aPlayerGk['message'] = $this->getPointMessage($aEachPlayer['player_id'], $iWeekId, $aEachPlayer['captain'] == 1);
			}
			else if( $aEachPlayer['position_id'] == 1 && $aEachPlayer['sub'] == 1 ) {
				$aPlayerGkSub['team_bg'] = $aEachPlayer['team_bg'];
				$aPlayerGkSub['color_light'] = $aEachPlayer['color_light'];
				$aPlayerGkSub['color_dark'] = $aEachPlayer['color_dark'];
				$aPlayerGkSub['player_name'] = $aEachPlayer['player_name'];
				$aPlayerGkSub['point'] = $aEachPlayer['point'];
				$aPlayerGkSub['is_captain'] = $aEachPlayer['captain'] == 1;
				$aPlayerGkSub['message'] = $this->getPointMessage($aEachPlayer['player_id'], $iWeekId, $aEachPlayer['captain'] == 1);
			}
			else if( $aEachPlayer['position_id'] == 2 && $aEachPlayer['in_11'] == 1 ) {
				$iIndex = count($aPlayerDf);
				$aPlayerDf[$iIndex] = array();
				$aPlayerDf[$iIndex]['team_bg'] = $aEachPlayer['team_bg'];
				$aPlayerDf[$iIndex]['color_light'] = $aEachPlayer['color_light'];
				$aPlayerDf[$iIndex]['color_dark'] = $aEachPlayer['color_dark'];
				$aPlayerDf[$iIndex]['player_name'] = $aEachPlayer['player_name'];
				$aPlayerDf[$iIndex]['point'] = $aEachPlayer['point'];
				$aPlayerDf[$iIndex]['is_captain'] = $aEachPlayer['captain'] == 1;
				$aPlayerDf[$iIndex]['message'] = $this->getPointMessage($aEachPlayer['player_id'], $iWeekId, $aEachPlayer['captain'] == 1);
			}
			else if( $aEachPlayer['position_id'] == 3 && $aEachPlayer['in_11'] == 1 ) {
				$iIndex = count($aPlayerMd);
				$aPlayerMd[$iIndex] = array();
				$aPlayerMd[$iIndex]['team_bg'] = $aEachPlayer['team_bg'];
				$aPlayerMd[$iIndex]['color_light'] = $aEachPlayer['color_light'];
				$aPlayerMd[$iIndex]['color_dark'] = $aEachPlayer['color_dark'];
				$aPlayerMd[$iIndex]['player_name'] = $aEachPlayer['player_name'];
				$aPlayerMd[$iIndex]['point'] = $aEachPlayer['point'];
				$aPlayerMd[$iIndex]['is_captain'] = $aEachPlayer['captain'] == 1;
				$aPlayerMd[$iIndex]['message'] = $this->getPointMessage($aEachPlayer['player_id'], $iWeekId, $aEachPlayer['captain'] == 1);
			}
			else if( $aEachPlayer['position_id'] == 4 && $aEachPlayer['in_11'] == 1 ) {
				$iIndex = count($aPlayerFw);
				$aPlayerFw[$iIndex] = array();
				$aPlayerFw[$iIndex]['team_bg'] = $aEachPlayer['team_bg'];
				$aPlayerFw[$iIndex]['color_light'] = $aEachPlayer['color_light'];
				$aPlayerFw[$iIndex]['color_dark'] = $aEachPlayer['color_dark'];
				$aPlayerFw[$iIndex]['player_name'] = $aEachPlayer['player_name'];
				$aPlayerFw[$iIndex]['point'] = $aEachPlayer['point'];
				$aPlayerFw[$iIndex]['is_captain'] = $aEachPlayer['captain'] == 1;
				$aPlayerFw[$iIndex]['message'] = $this->getPointMessage($aEachPlayer['player_id'], $iWeekId, $aEachPlayer['captain'] == 1);
			}
			else {
				$iIndex = count($aPlayerSub);
				$aPlayerSub[$iIndex] = array();
				$aPlayerSub[$iIndex]['team_bg'] = $aEachPlayer['team_bg'];
				$aPlayerSub[$iIndex]['color_light'] = $aEachPlayer['color_light'];
				$aPlayerSub[$iIndex]['color_dark'] = $aEachPlayer['color_dark'];
				$aPlayerSub[$iIndex]['player_name'] = $aEachPlayer['player_name'];
				$aPlayerSub[$iIndex]['point'] = $aEachPlayer['point'];
				$aPlayerSub[$iIndex]['is_captain'] = $aEachPlayer['captain'] == 1;
				$aPlayerSub[$iIndex]['message'] = $this->getPointMessage($aEachPlayer['player_id'], $iWeekId, $aEachPlayer['captain'] == 1);
			}
		}
		
		/* Get Minus Point */
		$sSqlStatement = "SELECT minus_point
			FROM `user_minus_point`
			WHERE status = 1 AND deleted = 0 AND user_id = $iUserId AND week_id = $iWeekId";
		$aMinusPoint = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		$iMinusPoint = count($aMinusPoint) == 0 ? 0 : $aMinusPoint[0]['minus_point'];
		
		$this->renderPartial('point_pitch', array(
				'aPlayerGk' => $aPlayerGk,
				'aPlayerDf' => $aPlayerDf,
				'aPlayerMd' => $aPlayerMd,
				'aPlayerFw' => $aPlayerFw,
				'aPlayerGkSub' => $aPlayerGkSub,
				'aPlayerSub' => $aPlayerSub,
				'iMinusPoint' => $iMinusPoint,
		));
	}
	
	public function getPointMessage($iPlayerId, $iWeekId, $bCaptain) {
		
		$sSqlStatement = "SELECT PT.short_name_th AS point_type_name, PP.count AS point_type_count,
				PP.total_point AS total_point, PT.can_count AS can_count
			FROM `player_point` PP JOIN `player_point_type` PT ON PP.point_type_id = PT.id
			WHERE PP.status = 1 AND PP.deleted = 0 AND PP.player_id = $iPlayerId AND PP.week_id = $iWeekId";
		$aPoint = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		if( count($aPoint) == 0 )
			return "ผู้เล่นไม่ได้ลงสนาม";
		
		$sMessage = "";
		foreach( $aPoint as $aEachPoint ) {
			$sPointTypeName = $aEachPoint['point_type_name'];
			$iPointCount = $aEachPoint['point_type_count'];
			$iTotalPoint = $aEachPoint['total_point'];
			if( $sMessage == "" ) {
				if( $aEachPoint['can_count'] == 0 )
					$sMessage = "$sPointTypeName ($iTotalPoint คะแนน)";
				else
					$sMessage = "$sPointTypeName x $iPointCount ($iTotalPoint คะแนน)";
			}
			else {
				if( $aEachPoint['can_count'] == 0 )
					$sMessage = "$sMessage<br>$sPointTypeName ($iTotalPoint คะแนน)";
				else
					$sMessage = "$sMessage<br>$sPointTypeName x $iPointCount ($iTotalPoint คะแนน)";
			}
		}
		if($bCaptain)
			$sMessage = "$sMessage<br>กัปตันทีม (x2 คะแนน)";
		
		return $sMessage;
	}

}
