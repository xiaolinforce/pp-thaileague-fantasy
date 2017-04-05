<?php

class RenderController extends Controller
{

	/**
	 * Declares class-based actions.
	 */
	public function actions()
	{
		return array(
			// captcha action renders the CAPTCHA image displayed on the contact page
			'captcha'=>array(
				'class'=>'CCaptchaAction',
				'backColor'=>0xFFFFFF,
			),
			// page action renders "static" pages stored under 'protected/views/site/pages'
			// They can be accessed via: index.php?r=site/page&view=FileName
			'page'=>array(
				'class'=>'CViewAction',
			),
		);
	}

	/**
	 * This is the action to handle external exceptions.
	 */
	public function actionError()
	{
	    if($error=Yii::app()->errorHandler->error)
	    {
	    	if(Yii::app()->request->isAjaxRequest)
	    		echo $error['message'];
	    	else
	        	$this->render('error', $error);
	    }
	}
	
	public function beforeAction($action) {
	
		if( isset( $_COOKIE['ppfantasy_username'] ) && isset( $_COOKIE['ppfantasy_password'] ) ) {
				
			$sSqlStatement = "SELECT password
				FROM `user`
				WHERE status = 1 AND deleted = 0 AND (email = :username OR username = :username)";
	
			$aResult = Yii::app()->db->createCommand($sSqlStatement)
				->bindValues([
						':username' => $_COOKIE['ppfantasy_username'],
				])
				->queryAll();
				
			if( count($aResult) == 0 ) {
				$this->actionRenderNeedLogin();
				return false;
			}
			else if( $aResult[0]['password'] != $_COOKIE['ppfantasy_password'] ) {
				$this->actionRenderNeedLogin();
				return false;
			}
		}
		else {
			$this->actionRenderNeedLogin();
			return false;
		}
		
		return true;
	}
	
	public function actionRenderPickTeam() {
		
		/* Get Players */
		$iUserId = Helpers::getUserId($_COOKIE['ppfantasy_username']);
		$iLatestWeekId = Helpers::getConfigValue('latest_week');
		$sSqlStatement = "SELECT C.image_rectangle AS teamBg, C.color_light AS colorLight, C.color_dark AS colorDark,
				XI.player_id AS playerId, P.called_name_th AS playerName, 
				P.current_club_id AS teamId, C.short_name_th AS teamName, POS.short_name AS position,
				XI.captain AS captain, XI.in_11 AS in_11
			FROM `user_my_xi` XI
				JOIN `player` P ON XI.player_id = P.id
				JOIN `club` C ON P.current_club_id = C.id
				JOIN `player_position` POS ON P.player_position_id = POS.id
			WHERE XI.status = 1 AND XI.deleted = 0 AND XI.user_id = $iUserId AND XI.week_id = $iLatestWeekId";
		$aPlayers = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		if( count($aPlayers) == 0 ) {
			$this->renderPartial('custom_text', array(
					'sText' => 'คุณยังไม่ได้ย้ายตัวเข้าทีม กรุณาไปที่ ซื้อ-ขาย ผู้เล่น เพื่อเลือกผู้เล่นเข้าทีมก่อน',
			));
			return;
		}
		
		/* Get Timeout */
		$sTimeout = Helpers::getConfigValue('next_timeout');
		$sCurrent = Helpers::getCurrentTime();
		$iTimeoutStamp = strtotime($sTimeout);
		$iCurrentStamp = strtotime($sCurrent);
		
		if( $iCurrentStamp > $iTimeoutStamp ) {
			$this->renderPartial('custom_text', array(
					'sText' => 'หมดเวลาจัดตัวสัปดาห์นี้แล้ว จะเริ่มให้จัดตัวสำหรับสัปดาห์ถัดไปได้หลังจากสัปดาห์นี้แข่งจบ 1-2 วัน',
			));
			return;
		}
		
		$aMonths = array('ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.');
		$iTimeoutDay = date('j', $iTimeoutStamp);
		$iTimeoutMonth = date('n', $iTimeoutStamp);
		$iTimeoutMonth = $aMonths[ $iTimeoutMonth - 1 ];
		$iTimeoutYear = intval(date('Y', $iTimeoutStamp)) + 543;
		$iTimeoutHour = date('H', $iTimeoutStamp);
		$iTimeoutMinute = date('i', $iTimeoutStamp);
		$sTimeOutNewFormat = "$iTimeoutDay $iTimeoutMonth $iTimeoutYear [$iTimeoutHour:$iTimeoutMinute]";
		
		/* Set new players format */
		$aGk = array();
		$aDf = array();
		$aMd = array();
		$aFw = array();
		$aGkSub = array();
		$aSub = array();
		for( $i = 0; $i < count($aPlayers); $i++ ) {
			//$aPlayers[$i]['teamBg'] = "images/" . $aPlayers[$i]['teamBg'];
			$aPlayers[$i]['teamBg'] = Helpers::getThumbnailSrc("images/" . $aPlayers[$i]['teamBg'], 100);
			$aPlayers[$i]['colorLight'] = "#" . $aPlayers[$i]['colorLight'];
			$aPlayers[$i]['colorDark'] = "#" . $aPlayers[$i]['colorDark'];
			$aPlayers[$i]['position'] = strtolower( $aPlayers[$i]['position'] );
			$aPlayers[$i]['captain'] = $aPlayers[$i]['captain'] == 1 ? 'true' : 'false';
			
			if( $aPlayers[$i]['position'] == "gk" && $aPlayers[$i]['in_11'] == 1 )
				$aGk = $aPlayers[$i];
			else if( $aPlayers[$i]['position'] == "gk" && $aPlayers[$i]['in_11'] == 0 )
				$aGkSub = $aPlayers[$i];
			else if( $aPlayers[$i]['in_11'] == 0 ) {
				$j = count($aSub);
				$aSub[$j] = array();
				$aSub[$j] = $aPlayers[$i];
			}
			else if( $aPlayers[$i]['position'] == "df" ) {
				$j = count($aDf);
				$aDf[$j] = array();
				$aDf[$j] = $aPlayers[$i];
			}
			else if( $aPlayers[$i]['position'] == "md" ) {
				$j = count($aMd);
				$aMd[$j] = array();
				$aMd[$j] = $aPlayers[$i];
			}
			else if( $aPlayers[$i]['position'] == "fw" ) {
				$j = count($aFw);
				$aFw[$j] = array();
				$aFw[$j] = $aPlayers[$i];
			}
		}

		$oWeek = Week::model()->findByPk($iLatestWeekId);
		$this->renderPartial('//pickTeam/pick_team', array(
				'sTimeout' => $sTimeOutNewFormat,
				'sFixture' => $oWeek->name_en,
				'aGk' => $aGk,
				'aDf' => $aDf,
				'aMd' => $aMd,
				'aFw' => $aFw,
				'aGkSub' => $aGkSub,
				'aSub' => $aSub,
		));
	}
	
	public function actionRenderPoint() {
	
		/* Check if played */
		$iUserId = Helpers::getUserId($_COOKIE['ppfantasy_username']);
		$sSqlStatement = "SELECT id
			FROM `user_my_xi`
			WHERE status = 1 AND deleted = 0 AND user_id = $iUserId
			LIMIT 1";
		$aResult = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		if( count($aResult) == 0 ) {
			$this->renderPartial('custom_text', array(
					'sText' => 'คุณยังไม่ได้เริ่มเล่นจึงยังไม่มีการบันทึกแต้ม'
			));
			return;
		}
		
		/* Get all played weeks */
		$sSqlStatement = "SELECT XI.week_id AS week_id, W.name_en AS week_name
			FROM `user_my_xi` XI JOIN `week` W ON XI.week_id = W.id
			WHERE XI.status = 1 AND XI.deleted = 0 AND XI.user_id = $iUserId
			GROUP BY XI.week_id
			ORDER BY W.fixture_no ASC";
		$aPlayedWeeks = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		/* Get total point */
		$sSqlStatement = "SELECT SUM(point) AS total_point
			FROM `user_my_xi`
			WHERE status = 1 AND deleted = 0 AND user_id = $iUserId AND in_11 = 1
			GROUP BY user_id";
		$iTotalPoint = Yii::app()->db->createCommand($sSqlStatement)->queryAll()[0]['total_point'];
		
		$sSqlStatement = "SELECT minus_point FROM `user` WHERE id = $iUserId";
		$iMinusPoint = Yii::app()->db->createCommand($sSqlStatement)->queryAll()[0]['minus_point'];

		/* Check is played on latest week */
		$iLatestWeek = Helpers::getConfigValue('week_to_show_in_point');
		$sSqlStatement = "SELECT count(id) AS count FROM `user_my_xi` 
			WHERE status = 1 AND deleted = 0 AND week_id = $iLatestWeek AND user_id = $iUserId";
		$iCount = Yii::app()->db->createCommand($sSqlStatement)->queryAll()[0]['count'];
		
		if( $iCount == 0)
			$iLatestWeek = Helpers::getConfigValue('latest_week');
		
		$this->renderPartial('//point/point', array(
				'aPlayedWeeks' => $aPlayedWeeks,
				'iTotalPoint' => $iTotalPoint - $iMinusPoint,
				'iLatestWeek' => $iLatestWeek
		));
	}
	
	public function actionRenderTransfer() {
	
		/* Get Timeout */
		$sTimeout = Helpers::getConfigValue('next_timeout');
		$sCurrent = Helpers::getCurrentTime();
		$iTimeoutStamp = strtotime($sTimeout);
		$iCurrentStamp = strtotime($sCurrent);
		
		if( $iCurrentStamp > $iTimeoutStamp ) {
			$this->renderPartial('custom_text', array(
					'sText' => 'หมดเวลาจัดตัวสัปดาห์นี้แล้ว จะเริ่มให้จัดตัวสำหรับสัปดาห์ถัดไปได้หลังจากสัปดาห์นี้แข่งจบ 1-2 วัน',
			));
			return;
		}
		
		/* Get user ID */
		$iUserId = Helpers::getUserId($_COOKIE['ppfantasy_username']);
		
		/* Get Quota */
		$sSqlStatement = "SELECT week_move_left, reset_move_left
				FROM `user_move_quota`
				WHERE status = 1 AND deleted = 0 AND user_id = $iUserId";
		$aResult = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		$iMoveQuota = $aResult[0]['week_move_left'];
		$iResetQuota = $aResult[0]['reset_move_left'];
		
		/* Get Teams */
		$sSqlStatement = "SELECT id, name_th, image_rectangle, color_dark, color_light
				FROM `club`
				WHERE status = 1 AND deleted = 0";
		$aTeams = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		/* Get My Teams */
		$sSqlStatement = "SELECT UMT.player_id AS player_id, P.current_club_id AS team_id, 
					P.nation_id AS nation_id, N.zone AS nation_zone, P.player_position_id AS position,
					P.called_name_th AS player_name, C.short_name_th AS team_name
				FROM `user_my_team` UMT
					JOIN `player` P ON UMT.player_id = P.id
					JOIN `nation` N ON P.nation_id = N.id
					JOIN `club` C ON P.current_club_id = C.id
				WHERE UMT.status = 1 AND UMT.deleted = 0 AND UMT.user_id = $iUserId 
				ORDER BY P.player_position_id ASC";
		$aMyTeam = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		$this->renderPartial('//transfer/transfer', array(
				'iMoveQuota' => $iMoveQuota,
				'iResetQuota' => $iResetQuota,
				'aTeams' => $aTeams,
				'aMyTeam' => $aMyTeam,
		));
	}
	
	public function actionRenderProgram() {
	
		$iCurrentSeason = Helpers::getConfigValue('latest_season');
		$sSqlStatement = "SELECT place, image_rectangle AS club_image, name_th AS club_name, 
				played, win, draw, lose, goal_for, goal_against, goal_difference, point
			FROM `score_table` ST JOIN `club` C ON ST.club_id = C.id
			WHERE ST.status = 1 AND ST.deleted = 0 AND tournament_id = 1 AND season_id = $iCurrentSeason
			ORDER BY place ASC";
		$aScoreTable = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		$this->renderPartial('//program/program', array(
				'aMatches' => $this->getProgramMatches(1, Helpers::getConfigValue('latest_season')),
				'aFixtures' => $this->getFixtures(1, Helpers::getConfigValue('latest_season')),
				'iLatestWeekId' => Helpers::getConfigValue('latest_week'),
				'aScoreTable' => $aScoreTable,
		));
	}
	
	public function actionRenderRule() {
	
		$this->renderPartial('rule');
	}
	
	public function actionRenderLeague() {
	
		$iUserId = Helpers::getUserId($_COOKIE['ppfantasy_username']);
		
		/* Get All Groups */
		$sSqlStatement = "SELECT UG.name AS group_name, UM.user_group_id AS group_id,
				CASE WHEN UM.user_id = UG.owner_user_id THEN 1 ELSE 0 END AS is_group_owner
			FROM `user_group_member` UM JOIN `user_group` UG ON UM.user_group_id = UG.id
			WHERE UM.status = 1 AND UM.deleted = 0 AND UM.user_id = $iUserId
			ORDER BY is_group_owner DESC, UG.created_date DESC";
		$aMyGroup = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		/* Get World Ranking */
		$sSqlStatement = "SELECT UP.place AS place, U.username AS username,
				UP.total_point AS total_point, UP.last_week_point AS last_week_point
			FROM `user_total_point` UP JOIN `user` U ON UP.user_id = U.id
			WHERE UP.status = 1 AND UP.deleted = 0 AND UP.place <= 50
			ORDER BY UP.place ASC";
		$aWorldRank = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		/* Get User Ranking */
		$sSqlStatement = "SELECT place, total_point, last_week_point
			FROM `user_total_point`
			WHERE status = 1 AND deleted = 0 AND user_id = $iUserId";
		$aUserRank = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		$this->renderPartial('//league/league', array(
				'aMyGroup' => $aMyGroup,
				'aWorldRank' => $aWorldRank,
				'aUserRank' => $aUserRank,
		));
	}
	
	public function actionRenderStat() {
	
		$this->renderPartial('under_construction');
	}
	
	public function actionRenderUnderConstruction() {
	
		$this->renderPartial('under_construction');
	}
	
	public function actionRenderNeedLogin() {
	
		$this->renderPartial('need_login');
	}
	
	public function getProgramMatches( $iTournamentId, $iSeasonId ) {
	
		/* Get Events */
		$sSqlStatement = "SELECT W.fixture_no AS fixtureNo, W.name_en AS fixtureName, W.id AS weekId,
					M.kickoff_time AS kickoffTime,
					C1.short_name_th AS homeName, C2.short_name_th AS awayName,
					C1.image_rectangle AS homeImg, C2.image_rectangle AS awayImg,
					M.home_score AS homeScore, M.away_score AS awayScore, M.id AS matchId
				FROM `matches` M
					JOIN `week` W ON M.week_id = W.id
					JOIN `club` C1 ON M.home_team_id = C1.id
					JOIN `club` C2 ON M.away_team_id = C2.id
				WHERE M.status = 1 AND M.deleted = 0 AND W.tournament_id = :tournamentId AND W.season_id = :seasonId
				ORDER BY W.fixture_no ASC, CAST(M.kickoff_time AS DATE) ASC, CAST(M.kickoff_time AS TIME) ASC";
	
		$aMatches = Yii::app()->db->createCommand($sSqlStatement)
			->bindValues([
					':tournamentId' => $iTournamentId,
					':seasonId' => $iSeasonId,
			])
			->queryAll();
			
		/* Set date and time and image */
		$aAllMonth = array('ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.');
		for( $i = 0; $i < count($aMatches); $i++ ) {
			$iTimeStamp = strtotime($aMatches[$i]['kickoffTime']);
			$iDate = date('j', $iTimeStamp);
			$sMonth = $aAllMonth[ date('n', $iTimeStamp) - 1 ];
			$iYear = date('Y', $iTimeStamp) + 543;
			$aMatches[$i]['date'] = "$iDate $sMonth $iYear";
			$aMatches[$i]['time'] = date('G:i', $iTimeStamp);
			$aMatches[$i]['homeImg'] = Helpers::getThumbnailSrc('images/'.$aMatches[$i]['homeImg'], 50);
			$aMatches[$i]['awayImg'] = Helpers::getThumbnailSrc('images/'.$aMatches[$i]['awayImg'], 50);
		}
	
		return $aMatches;
	}
	
	public function getFixtures($iTournamentId, $iSeasonId) {
		$sSqlStatement = "SELECT W.id AS weekId, W.name_en AS weekName
				FROM `matches` M JOIN `week` W ON M.week_id = W.id
				WHERE M.status = 1 AND M.deleted = 0 AND W.tournament_id = :tournamentId AND W.season_id = :seasonId
				GROUP BY W.fixture_no
				ORDER BY W.fixture_no ASC";
		
		$aFixtures = Yii::app()->db->createCommand($sSqlStatement)
			->bindValues([
					':tournamentId' => $iTournamentId,
					':seasonId' => $iSeasonId,
			])
			->queryAll();
			
		return $aFixtures;
	}

}
