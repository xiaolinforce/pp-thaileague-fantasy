<?php

class ProgramController extends Controller
{
	public function actionIndex() {
		echo 'cannot access';
	}
	
	public function actionGetMatchDetail( $iMatchId ) {
		
		if( intval($iMatchId) == 0 ) {
			echo 2;
			return;
		}
		
		/* Get Match Detail */
		$sSqlStatement = "SELECT C1.image_rectangle AS homeImg, C2.image_rectangle AS awayImg,
					M.home_score AS homeScore, M.away_score AS awayScore, M.kickoff_time AS kickoffTime, S.name_th AS stadium,
					M.home_team_id AS home_id, M.away_team_id AS away_id
				FROM `matches` M
					JOIN `club` C1 ON M.home_team_id = C1.id
					JOIN `club` C2 ON M.away_team_id = C2.id
					JOIN `stadium` S ON M.stadium_id = S.id
				WHERE M.status = 1 AND M.deleted = 0 AND M.id = :matchId";
		
		$aMatch = Yii::app()->db->createCommand($sSqlStatement)
			->bindValues([
					':matchId' => $iMatchId,
			])
			->queryAll();
			
		/* Get Match Player */
		$sSqlStatement = "SELECT MP.shirt_no AS shirtNo, POS.short_name AS position, 
					P.name_th AS name, P.surname_th AS surname, P.called_name_th AS calledName, P.nation_id AS nation,
					MP.captain AS captain, MP.start_11 AS start11, MP.club_id AS clubId
				FROM `match_player` MP 
					JOIN `player` P ON MP.player_id = P.id
					JOIN `player_position` POS ON P.player_position_id = POS.id
				WHERE MP.status = 1 AND MP.deleted = 0 AND MP.match_id = :matchId
				ORDER BY MP.club_id ASC, MP.start_11 DESC, P.player_position_id ASC, MP.shirt_no ASC";
		
		$aMatchPlayer = Yii::app()->db->createCommand($sSqlStatement)
			->bindValues([
					':matchId' => $iMatchId,
			])
			->queryAll();
			
		/* Get Events */
		$sSqlStatement = "SELECT ME.minute AS minute, ME.period AS period, ET.name_short AS type, C.short_name_th AS team, 
					P1.name_th AS name1, P1.surname_th AS surname1, P1.called_name_th AS calledName1, P1.nation_id AS nation1,
					P2.name_th AS name2, P2.surname_th AS surname2, P2.called_name_th AS calledName2, P2.nation_id AS nation2,
					ET.image AS type_image
				FROM `match_event` ME 
					JOIN `event_type` ET ON ME.event_id = ET.id
					JOIN `club` C ON ME.club_id = C.id
					JOIN `player` P1 ON ME.player_id = P1.id
					LEFT JOIN `player` P2 ON ME.second_player_id = P2.id
				WHERE ME.status = 1 AND ME.deleted = 0 AND ME.match_id = :matchId
				ORDER BY ME.period ASC, ME.minute ASC";
		
		$aMatchEvent = Yii::app()->db->createCommand($sSqlStatement)
			->bindValues([
					':matchId' => $iMatchId,
			])
			->queryAll();
			
		/* Create Final Array to return */
		$aFinalResult = array();
		$aFinalResult = $aMatch[0];
		$aFinalResult['matchId'] = $iMatchId;
		$aFinalResult['matchPlayer'] = $aMatchPlayer;
		$aFinalResult['matchEvent'] = $aMatchEvent;
		
		// Add prefix 'images/'
		$aFinalResult['homeImg'] = 'images/' . $aFinalResult['homeImg'];
		$aFinalResult['awayImg'] = 'images/' . $aFinalResult['awayImg'];
		
		// Renew Date and Time
		$iTimeStamp = strtotime($aFinalResult['kickoffTime']);
		$aAllDay = array('อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์');
		$aAllMonth = array('มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม');
		$sDay = $aAllDay[ date('w', $iTimeStamp) ];
		$iDate = date('j', $iTimeStamp);
		$sMonth = $aAllMonth[ date('n', $iTimeStamp) - 1 ];
		$iYear = date('Y', $iTimeStamp) + 543;
		$aFinalResult['date'] = "วัน" . $sDay . "ที่ $iDate $sMonth พ.ศ. $iYear";
		$aFinalResult['time'] = date('G:i', $iTimeStamp);
		
		$aFinalResult['stadium'] = 'สนาม ' . $aFinalResult['stadium'];
		
		echo json_encode($aFinalResult);
	}

}
