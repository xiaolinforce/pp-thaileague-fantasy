<?php

class AdminController extends Controller
{
	
	public function actionIndex() {
		$this->renderPartial('admin');
	}

	public function checkAuthentication() {
		
		if( isset( $_COOKIE['ppfantasy_username'] ) && isset( $_COOKIE['ppfantasy_password'] ) ) {
		
			$sSqlStatement = "SELECT password
				FROM `user`
				WHERE status = 1 AND deleted = 0 AND role_id <> 1 AND (email = :username OR username = :username)";
		
			$aResult = Yii::app()->db->createCommand($sSqlStatement)
				->bindValues([
						':username' => $_COOKIE['ppfantasy_username'],
				])
				->queryAll();
		
			if( count($aResult) == 0 )
				return false;
			
			if( $aResult[0]['password'] != $_COOKIE['ppfantasy_password'] )
				return false;
			
			return true;
		}
		else
			return false;
	}
	
	public function actionCheckLogin() {
		
		$sSqlStatement = "SELECT id
				FROM `user`
				WHERE status = 1 AND deleted = 0 AND role_id <> 0 AND 
					(email = :username OR username = :username) AND password = :password";
		
		$aResult = Yii::app()->db->createCommand($sSqlStatement)
			->bindValues([
					':username' => $_POST['username'],
					':password' => sha1($_POST['password']),
			])
			->queryAll();
		
		if( count($aResult) > 0 ) {
			$cookieTime = time() + 3600*24;
			setcookie('ppfantasy_username', $_POST['username'], $cookieTime, "/");
			setcookie('ppfantasy_password', sha1($_POST['password']), $cookieTime, "/");
			echo 1;
		}
		else
			echo 0;
	}
	
	public function actionLogOut() {
		setcookie('ppfantasy_username', "", time() - 3600, "/");
		setcookie('ppfantasy_password', "", time() - 3600, "/");
		$this->renderPartial('admin');
	}
	
	public function actionMenu() {
		
		/* Check Authentication */
		if( !$this->checkAuthentication() ) {
			$this->renderPartial('admin');
			return;
		}
		
		$iLatestSeason = Helpers::getConfigValue('latest_season');
		$iTournamentForMatch = 1;
		$iWeekIdForMatch = Helpers::getConfigValue('week_to_show_in_point');
		
		$sSqlStatement = "SELECT fixture_no FROM `week` WHERE id = $iWeekIdForMatch";
		$iFixtureForMatch = Yii::app()->db->createCommand($sSqlStatement)->queryAll()[0]['fixture_no'];
		
		$this->renderPartial('menu', array(
				'iLatestSeason' => $iLatestSeason,
				'iTournamentForMatch' => $iTournamentForMatch,
				'iFixtureForMatch' => $iFixtureForMatch,
		));
	}
	
	public function actionRenderMatch($iHome = 0, $iAway = 0, $iFixture = 0, $iTournament = 0, $iSeason = 0) {
		
		/* Check Authentication */
		if( !$this->checkAuthentication() ) {
			$this->renderPartial('admin');
			return;
		}
		
		/* Matches */
		$sCondition_Home = $iHome == 0 ? "AND (C1.id = :homeId OR 1=1)" : "AND C1.id = :homeId";
		$sCondition_Away = $iAway == 0 ? "AND (C2.id = :awayId OR 1=1)" : "AND C2.id = :awayId";
		$sCondition_Fixture = $iFixture == 0 ? "AND (W.fixture_no = :fixture OR 1=1)" : "AND W.fixture_no = :fixture";
		$sCondition_Tournament = $iTournament == 0 ? "AND (W.tournament_id = :tournament OR 1=1)" : "AND W.tournament_id = :tournament";
		$sCondition_Season = $iSeason == 0 ? "AND (W.season_id = :season OR 1=1)" : "AND W.season_id = :season";
		
		$sSqlStatement = "SELECT M.id AS match_id, M.approved AS approved, 
					C1.short_name_th AS home_name, C1.image_rectangle AS home_image,
					C2.short_name_th AS away_name, C2.image_rectangle AS away_image,
					W.name_en AS fixture, T.name_th AS tournament, S.name AS season
				FROM `matches` M
					JOIN `club` C1 ON M.home_team_id = C1.id
					JOIN `club` C2 ON M.away_team_id = C2.id
					JOIN `week` W ON M.week_id = W.id
					JOIN `tournament` T ON W.tournament_id = T.id
					JOIN `season` S ON W.season_id = S.id
				WHERE M.status = 1 AND M.deleted = 0 $sCondition_Home $sCondition_Away 
					$sCondition_Fixture $sCondition_Tournament $sCondition_Season";
		
		$aMatches = Yii::app()->db->createCommand($sSqlStatement)
			->bindValues([
					':homeId' => $iHome,
					':awayId' => $iAway,
					':fixture' => $iFixture,
					':tournament' => $iTournament,
					':season' => $iSeason,
			])
			->queryAll();
		
		for( $i = 0; $i < count($aMatches); $i++ ) {
			$aMatches[$i]['home_image'] = Helpers::getThumbnailSrc('images/'.$aMatches[$i]['home_image'], 50);
			$aMatches[$i]['away_image'] = Helpers::getThumbnailSrc('images/'.$aMatches[$i]['away_image'], 50);
		}
		
		/* Teams */
		$sSqlStatement = "SELECT id, short_name_th FROM `club` WHERE status = 1 AND deleted = 0";
		$aTeams = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		/* Tournaments */
		$sSqlStatement = "SELECT id, name_th FROM `tournament` WHERE status = 1 AND deleted = 0";
		$aTournaments = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		/* Seasons */
		$sSqlStatement = "SELECT id, name FROM `season` WHERE status = 1 AND deleted = 0";
		$aSeasons = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
			
		$this->renderPartial('match', array(
				'aMatches' => $aMatches,
				'aTeams' => $aTeams,
				'aTournaments' => $aTournaments,
				'aSeasons' => $aSeasons,
		));
	}
	
	public function actionRenderMatchDetail($iMatchId) {
		
		/* Check Authentication */
		if( !$this->checkAuthentication() ) {
			$this->renderPartial('admin');
			return;
		}
		
		/* Get Inputs for Link back to Match Screen */
		$iLatestSeason = Helpers::getConfigValue('latest_season');
		$iTournamentForMatch = 1;
		$iWeekIdForMatch = Helpers::getConfigValue('week_to_show_in_point');
		$sSqlStatement = "SELECT fixture_no FROM `week` WHERE id = $iWeekIdForMatch";
		$iFixtureForMatch = Yii::app()->db->createCommand($sSqlStatement)->queryAll()[0]['fixture_no'];
		
		/* Get oMatch */
		$oMatch = Matches::model()->findByPk($iMatchId);
		
		$this->renderPartial('match_detail', array(
				'iLatestSeason' => $iLatestSeason,
				'iTournamentForMatch' => $iTournamentForMatch,
				'iFixtureForMatch' => $iFixtureForMatch,
				'oMatch' => $oMatch,
				'oClubHome' => Club::model()->findByPk( $oMatch->home_team_id ),
				'oClubAway' => Club::model()->findByPk( $oMatch->away_team_id ),
		));
	}
	
	public function actionSelect2Player($q = '') {
	
		$sSqlStatement = "SELECT id, name_th, surname_th, called_name_th, nation_id
				FROM `player`
				WHERE status = 1 AND deleted = 0 AND
					( CONCAT(name_th, ' ', surname_th) LIKE :search OR called_name_th LIKE :search )
				ORDER BY name_th ASC
				LIMIT 100";
	
		$aPlayer = Yii::app()->db->createCommand($sSqlStatement)
			->bindValues([
					':search' => '%'.$q.'%',
			])
			->queryAll();
			
		$aNewData = array();
		for($i = 0; $i < count($aPlayer); $i++) {
			$sFullName = $aPlayer[$i]['name_th'] . ' ' . $aPlayer[$i]['surname_th'];
			$aNewData[$i]['id'] = $aPlayer[$i]['id'];
			if( $aPlayer[$i]['nation_id'] == 189 )
				$aNewData[$i]['text'] = $sFullName;
			else
				$aNewData[$i]['text'] = $sFullName . ' (' . $aPlayer[$i]['called_name_th'] . ')';
		}
	
		echo json_encode($aNewData);
	}
	
	public function actionRenderQuickMenu() {
		
		/* Check Authentication */
		if( !$this->checkAuthentication() ) {
			$this->renderPartial('admin');
			return;
		}
		
		/* Get All Teams */
		$sSqlStatement = "SELECT id, short_name_th AS name FROM `club` WHERE status = 1 AND deleted = 0 ORDER BY short_name_th ASC";
		$aTeams = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		/* Get Matches */
		$sSqlStatement = "SELECT M.id AS match_id, C1.short_name_th AS home_name, C2.short_name_th AS away_name, 
				W.fixture_no AS fixture, M.approved AS approved
				FROM `matches` M
					JOIN `club` C1 ON M.home_team_id = C1.id
					JOIN `club` C2 ON M.away_team_id = C2.id
					JOIN `week` W ON M.week_id = W.id
				WHERE M.status = 1 AND M.deleted = 0
				ORDER BY W.fixture_no DESC, M.approved ASC, C1.short_name_th ASC";
		$aMatches = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		$this->renderPartial('quick_menu', array(
				'aTeams' => $aTeams,
				'aMatches' => $aMatches,
		));
	}
	
	public function actionRenderQuickPlayer( $iClubId = 0 ) {
		
		/* Check Authentication */
		if( !$this->checkAuthentication() ) {
			$this->renderPartial('admin');
			return;
		}
		
		/* Get Players of Team */
		$sSqlStatement = "SELECT id, name_th, surname_th, called_name_th, current_shirt_no, player_position_id 
				FROM `player` 
				WHERE status = 1 AND deleted = 0 AND current_club_id = $iClubId
				ORDER BY called_name_th ASC";
		$aPlayersTeam = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		/* Get All Players */
		$sSqlStatement = "SELECT id, name_th, surname_th, called_name_th
				FROM `player`
				WHERE status = 1 AND deleted = 0 
				ORDER BY called_name_th ASC";
		$aPlayers = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		/* Get Nations */
		$sSqlStatement = "SELECT id, name_th FROM `nation` WHERE status = 1 AND deleted = 0 ORDER BY name_th ASC";
		$aNations = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		$this->renderPartial('quick_player', array(
				'oClub' => Club::model()->findByPk($iClubId),
				'aPlayersTeam' => $aPlayersTeam,
				'aPlayers' => $aPlayers,
				'aNations' => $aNations,
		));
	}
	
	public function actionRemovePlayerFromTeam() {
		
		/* Check Authentication */
		if( !$this->checkAuthentication() ) {
			echo 0;
			return;
		}
		
		$iPlayerId = $_POST['playerId'];
		$sSqlStatement = "UPDATE `player` SET current_club_id = 0 WHERE id = $iPlayerId";
		Yii::app()->db->createCommand($sSqlStatement)->execute();
		echo 1;
	}
	
	public function actionAddPlayerToTeam() {
	
		/* Check Authentication */
		if( !$this->checkAuthentication() ) {
			echo 0;
			return;
		}
		
		$iPlayerId = $_POST['playerId'];
		$iTeamId = $_POST['teamId'];
		$sSqlStatement = "UPDATE `player` SET current_club_id = $iTeamId WHERE id = $iPlayerId";
		Yii::app()->db->createCommand($sSqlStatement)->execute();
		echo 1;
	}
	
	public function actionAddPlayerNew() {
		
		/* Check Authentication */
		if( !$this->checkAuthentication() ) {
			echo 0;
			return;
		}
		
		$model = new Player();
		$model->name_th = $_POST['name_th'];
		$model->surname_th = $_POST['surname_th'];
		$model->name_en = $_POST['name_en'];
		$model->surname_en = $_POST['surname_en'];
		$model->called_name_th = $_POST['called_name'];
		$model->birthdate = $_POST['birthdate'] == '' ? null : $_POST['birthdate'];
		$model->current_shirt_no = $_POST['shirt_no'];
		$model->player_position_id = $_POST['position'];
		$model->nation_id = $_POST['nation'];
		$model->current_club_id = $_POST['club_id'];
		$model->created_date = Helpers::getCurrentTime();
		$model->created_by = Helpers::getUserId( $_COOKIE['ppfantasy_username'] );
		
		if( $model->save() )
			echo 1;
		else
			echo 0;
	}
	
	public function actionSaveQuickMenuPlayer() {
		
		/* Check Authentication */
		if( !$this->checkAuthentication() ) {
			echo 0;
			return;
		}
		
		$a3Inputs = explode('|', $_POST['inputs']);
		$aPlayerId = explode(',', $a3Inputs[0]);
		$aShirtNo = explode(',', $a3Inputs[1]);
		$aPosition = explode(',', $a3Inputs[2]);
		
		for( $i = 0; $i < count($aPlayerId); $i++ ) {
			$iShirtNo = $aShirtNo[$i];
			$iPosition = $aPosition[$i];
			$iPlayerId = $aPlayerId[$i];
			$sCurrentTime = Helpers::getCurrentTime();
			$iCurrentUser = Helpers::getUserId( $_COOKIE['ppfantasy_username'] );
			
			$sSqlStatement = "UPDATE `player` 
				SET current_shirt_no = $iShirtNo, player_position_id = $iPosition,
					modified_date = '$sCurrentTime', modified_by = $iCurrentUser
				WHERE id = $iPlayerId";
			Yii::app()->db->createCommand($sSqlStatement)->execute();
		}
		
		echo 1;
	}
	
	public function actionRenderQuickMatch( $iMatchId = 0 ) {
	
		/* Check Authentication */
		if( !$this->checkAuthentication() ) {
			$this->renderPartial('admin');
			return;
		}
		
		/* Get Clubs */
		$oMatch = Matches::model()->findByPk($iMatchId);
		$oHomeClub = Club::model()->findByPk( $oMatch->home_team_id );
		$oAwayClub = Club::model()->findByPk( $oMatch->away_team_id );
		
		/* Get Stadium */
		$oStadium = Stadium::model()->findByPk( $oMatch->stadium_id );
		
		/* Get Match Player */
		$sSqlStatement = "SELECT MP.id AS mpid, MP.club_id AS club_id, MP.player_id AS player_id,
					MP.start_11 AS start_11, MP.captain AS captain, MP.shirt_no AS shirt_no,
					P.name_th AS name_th, P.surname_th AS surname_th, P.called_name_th AS called_name,
					P.nation_id AS nation, POS.short_name AS position
				FROM `match_player` MP 
					JOIN `player` P ON MP.player_id = P.id
					JOIN `player_position` POS ON P.player_position_id = POS.id
				WHERE MP.status = 1 AND MP.deleted = 0 AND MP.match_id = $iMatchId
				ORDER BY MP.club_id ASC, MP.shirt_no ASC";
		$aMatchPlayer = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		/* Get Event Type */
		$sSqlStatement = "SELECT id, name_en FROM `event_type` WHERE status = 1 AND deleted = 0";
		$aEventType = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		/* Get Match Event */
		$sSqlStatement = "SELECT C.short_name_th AS club_name, ET.name_short AS event_short, ET.name_en AS event_name, 
					P1.name_th AS p1_name, P1.surname_th AS p1_surname, P1.called_name_th AS p1_called_name, P1.nation_id AS p1_nation,
					P2.name_th AS p2_name, P2.surname_th AS p2_surname, P2.called_name_th AS p2_called_name, P2.nation_id AS p2_nation,
					ME.period AS period, ME.minute AS minute, ME.id AS meid, 
					ME.area_of_shoot AS area_of_shoot, ME.shoot_by AS shoot_by, 
					ME.is_freekick AS is_freekick, ME.part_of_goal_shot AS part_of_goal_shot,
					ME.id AS id, ME.club_id AS club_id, ME.second_player_id AS p2_id
				FROM `match_event` ME
					JOIN `club` C ON ME.club_id = C.id
					JOIN `event_type` ET ON ME.event_id = ET.id
					JOIN `player` P1 ON ME.player_id = P1.id
					LEFT JOIN `player` P2 ON ME.second_player_id = P2.id
				WHERE ME.status = 1 AND ME.deleted = 0 AND ME.match_id = $iMatchId
				ORDER BY ME.period ASC, ME.minute ASC";
		$aMatchEvent = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		for( $i = 0; $i < count($aMatchEvent); $i++ ) {
			$iClubId = $aMatchEvent[$i]['club_id'];
			$iSecondPlayerId = $aMatchEvent[$i]['p2_id'];
			$sSqlStatement = "SELECT shirt_no FROM `match_player`
				WHERE status = 1 AND deleted = 0 
					AND club_id = $iClubId AND player_id = $iSecondPlayerId 
					AND match_id = $iMatchId";
			$aPlayer2 = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
			$aMatchEvent[$i]['p2_shirt_no'] = count($aPlayer2) == 0 ? 0 : $aPlayer2[0]['shirt_no'];
		}
		
		/* Get Match Save */
		$sSqlStatement = "SELECT MS.id AS id, P.called_name_th AS player_name, MS.total_saved AS saved
			FROM `match_save` MS JOIN `player` P ON MS.player_id = P.id
			WHERE MS.status = 1 AND MS.deleted = 0 AND MS.match_id = $iMatchId";
		$aMatchSave = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		/* Get Coaches */
		$sSqlStatement = "SELECT id, name_th, surname_th FROM `coach` WHERE status = 1 AND deleted = 0";
		$aCoaches = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		/* Check is there a change of GK */
		$sSqlStatement = "SELECT ME.id AS id
			FROM `match_event` ME
				JOIN `player` P1 ON ME.player_id = P1.id
				LEFT JOIN `player` P2 ON ME.second_player_id = P2.id
				JOIN `event_type` ET ON ME.event_id = ET.id
			WHERE ME.status = 1 AND ME.deleted = 0 AND ET.name_short = 'SUB' AND 
				(P1.player_position_id = 1 OR P2.player_position_id = 1) AND
				ME.match_id = $iMatchId";
		$aCheckSubGK = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		/* Check is there a second yellow card */
		$sSqlStatement = "SELECT COUNT(id) AS total_yellow_card
			FROM `match_event`
			WHERE status = 1 AND deleted = 0 AND event_id = 8 AND match_id = $iMatchId
			GROUP BY player_id
			HAVING COUNT(id) >= 2";
		$aCheckSecondYellow = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
	
		$this->renderPartial('quick_match', array(
				'iMatchId' => $iMatchId,
				'oMatch' => $oMatch,
				'oHomeClub' => $oHomeClub,
				'oAwayClub' => $oAwayClub,
				'aMatchPlayer' => $aMatchPlayer,
				'aEventType' => $aEventType,
				'aMatchEvent' => $aMatchEvent,
				'iManOfTheMatch' => $oMatch->man_of_the_match,
				'iApproved' => $oMatch->approved,
				'iHomeScore' => $oMatch->home_score,
				'iAwayScore' => $oMatch->away_score,
				'aMatchSave' => $aMatchSave,
				'bIsSubGK' => count($aCheckSubGK) > 0,
				'bSecondYellow' => count($aCheckSecondYellow) > 0,
				'aCoaches' => $aCoaches,
				'sStadium' => $oStadium->name_th,
		));
	}
	
	public function actionAddPlayerToMatchPlayer() {
		
		/* Check Authentication */
		if( !$this->checkAuthentication() ) {
			echo 0;
			return;
		}
		
		/* Inputs */
		$iMatchId = $_POST['match_id'];
		$iPlayerId = $_POST['player_id'];
		$iClubId = $_POST['club_id'];
		$iStart11 = $_POST['start_11'];
		$iShirtNo = $_POST['shirt_no'];
		$sCurrentDate = Helpers::getCurrentTime();
		$iCurrentUser = Helpers::getUserId( $_COOKIE['ppfantasy_username'] );
		
		/* Save Match Player*/
		$model = new MatchPlayer();
		$model->match_id = $iMatchId;
		$model->player_id = $iPlayerId;
		$model->club_id = $iClubId;
		$model->start_11 = $iStart11;
		$model->shirt_no = $iShirtNo;
		$model->created_date = $sCurrentDate;
		$model->created_by = $iCurrentUser;
		
		if( !$model->save() ) {
			echo 0;
			return;
		}
		
		/* Remove old shirt */
		$sSqlStatement = "UPDATE `player`
			SET current_shirt_no = 0,
				modified_date = '$sCurrentDate',
				modified_by = $iCurrentUser
			WHERE status = 1 AND deleted = 0 AND current_shirt_no = $iShirtNo AND current_club_id = $iClubId";
		Yii::app()->db->createCommand($sSqlStatement)->execute();
		
		/* Update Player */
		Player::model()->updateByPk( $iPlayerId, array(
				'current_club_id' => $iClubId,
				'current_shirt_no' => $iShirtNo,
				'modified_date' => $sCurrentDate,
				'modified_by' => $iCurrentUser,
		) );
		
		echo 1;
	}
	
	public function actionGetPlayerCurrentShirtNo( $iPlayerId ) {
		
		/* Check Authentication */
		if( !$this->checkAuthentication() ) {
			echo 0;
			return;
		}
		
		$oPlayer = Player::model()->findByPk( $iPlayerId );
		echo $oPlayer->current_shirt_no;
	}
	
	public function actionSetCaptainForMatchPlayer() {
		
		/* Check Authentication */
		if( !$this->checkAuthentication() ) {
			echo 0;
			return;
		}
		
		/* Inputs */
		$iMpId = $_POST['mpid'];
		$sCurrentTime = Helpers::getCurrentTime();
		$iCurrentUser = Helpers::getUserId( $_COOKIE['ppfantasy_username'] );
		
		/* Get Match Player */
		$oMatchPlayer = MatchPlayer::model()->findByPk($iMpId);
		$iMatchId = $oMatchPlayer->match_id;
		$iClubId = $oMatchPlayer->club_id;
		
		/* Delete old captain */
		$sSqlStatement = "UPDATE `match_player`
			SET captain = 0, modified_date = '$sCurrentTime', modified_by = $iCurrentUser
			WHERE status = 1 AND deleted = 0 AND match_id = $iMatchId AND club_id = $iClubId AND captain = 1";
		Yii::app()->db->createCommand($sSqlStatement)->execute();
		
		/* Set new captain */
		MatchPlayer::model()->updateByPk( $iMpId, array(
				'captain' => 1,
				'modified_date' => $sCurrentTime,
				'modified_by' => $iCurrentUser,
		) );
		
		echo 1;
	}
	
	public function actionDeleteMatchPlayer() {
		
		/* Check Authentication */
		if( !$this->checkAuthentication() ) {
			echo 0;
			return;
		}
		
		/* Inputs */
		$iMpId = $_POST['mpid'];
		
		MatchPlayer::model()->updateByPk( $iMpId, array(
				'deleted' => 1,
				'modified_date' => Helpers::getCurrentTime(),
				'modified_by' => Helpers::getUserId( $_COOKIE['ppfantasy_username'] ),
		) );
		
		echo 1;
	}
	
	public function actionAddEventToMatchEvent() {
		
		/* Check Authentication */
		if( !$this->checkAuthentication() ) {
			echo 0;
			return;
		}
		
		/* Inputs */
		$iMatchId = $_POST['matchId'];
		$iClubId = $_POST['clubId'];
		$iPlayerId = $_POST['playerId'];
		$iSecondPlayerId = $_POST['secondPlayerId'];
		$iEventId = $_POST['eventId'];
		$iMinute = $_POST['minute'];
		$iAddMinute = $_POST['addMinute'];
		$sCurrentTime = Helpers::getCurrentTime();
		$iCurrentUser = Helpers::getUserId( $_COOKIE['ppfantasy_username'] );
		
		/* Add Event */
		$model = new MatchEvent();
		$model->match_id = $iMatchId;
		$model->club_id = $iClubId;
		$model->player_id = $iPlayerId;
		$model->second_player_id = $iSecondPlayerId;
		$model->event_id = $iEventId;
		$model->minute = $iMinute + $iAddMinute;
		$model->period = $iMinute <= 45 ? 1 : 2;
		$model->created_date = $sCurrentTime;
		$model->created_by = $iCurrentUser;
		
		if( $model->save() )
			echo 1;
		else
			echo 0;
	}
	
	public function actionDeleteMatchEvent() {
	
		/* Check Authentication */
		if( !$this->checkAuthentication() ) {
			echo 0;
			return;
		}
	
		/* Inputs */
		$iMeId = $_POST['meid'];
	
		MatchEvent::model()->updateByPk( $iMeId, array(
				'deleted' => 1,
				'modified_date' => Helpers::getCurrentTime(),
				'modified_by' => Helpers::getUserId( $_COOKIE['ppfantasy_username'] ),
		) );
	
		echo 1;
	}
	
	public function actionSaveManOfTheMatch() {
	
		/* Check Authentication */
		if( !$this->checkAuthentication() ) {
			echo 0;
			return;
		}
	
		/* Inputs */
		$iMatchId = $_POST['match_id'];
		$iPlayerId = $_POST['player_id'];
	
		Matches::model()->updateByPk( $iMatchId, array(
				'man_of_the_match' => $iPlayerId,
				'modified_date' => Helpers::getCurrentTime(),
				'modified_by' => Helpers::getUserId( $_COOKIE['ppfantasy_username'] ),
		) );
	
		echo 1;
	}
	
	public function actionSetApprovedMatch() {
	
		/* Check Authentication */
		if( !$this->checkAuthentication() ) {
			echo 0;
			return;
		}
	
		/* Inputs */
		$iMatchId = $_POST['match_id'];
		$iApproved = $_POST['approved'];
	
		Matches::model()->updateByPk( $iMatchId, array(
				'approved' => $iApproved,
				'modified_date' => Helpers::getCurrentTime(),
				'modified_by' => Helpers::getUserId( $_COOKIE['ppfantasy_username'] ),
		) );
	
		echo 1;
	}
	
	public function actionSaveMatchScore() {
	
		/* Check Authentication */
		if( !$this->checkAuthentication() ) {
			echo 0;
			return;
		}
	
		/* Inputs */
		$iMatchId = $_POST['match_id'];
		$iHomeScore = $_POST['home_score'];
		$iAwayScore = $_POST['away_score'];
	
		Matches::model()->updateByPk( $iMatchId, array(
				'home_score' => $iHomeScore,
				'away_score' => $iAwayScore,
				'modified_date' => Helpers::getCurrentTime(),
				'modified_by' => Helpers::getUserId( $_COOKIE['ppfantasy_username'] ),
		) );
	
		echo 1;
	}
	
	public function actionSaveMatchAddedMin() {
	
		/* Check Authentication */
		if( !$this->checkAuthentication() ) {
			echo 0;
			return;
		}
	
		/* Inputs */
		$iMatchId = $_POST['match_id'];
		$iFirstAddedMin = $_POST['first_added_min'];
		$iSecondAddedMin = $_POST['second_added_min'];
	
		Matches::model()->updateByPk( $iMatchId, array(
				'added_min_first_half' => $iFirstAddedMin,
				'added_min_second_half' => $iSecondAddedMin,
				'modified_date' => Helpers::getCurrentTime(),
				'modified_by' => Helpers::getUserId( $_COOKIE['ppfantasy_username'] ),
		) );
	
		echo 1;
	}
	
	public function actionCommandLineSaveMatchPlayer() {
		
		/* Check Authentication */
		if( !$this->checkAuthentication() ) {
			echo 0;
			return;
		}
		
		/* Inputs */
		$iMatchId = $_POST['match_id'];
		$sCommand = $_POST['command'];
		$oMatch = Matches::model()->findByPk($iMatchId);
		$iCurrentUser = Helpers::getUserId( $_COOKIE['ppfantasy_username'] );
		
		/* Loop through each command */
		$aCommands = explode(";", $sCommand);
		foreach( $aCommands as $aEachCommand ) {
			
			$aBreakCommand = explode(" ", $aEachCommand);
			
			/* Check command's format */
			if( count($aBreakCommand) != 3 ) {
				echo 2;
				return;
			}
			if( $aBreakCommand[0] != 'h' && $aBreakCommand[0] != 'a' ) {
				echo 3;
				return;
			}
			if( $aBreakCommand[1] != 'start' && $aBreakCommand[1] != 'sub' ) {
				echo 4;
				return;
			}
			
			$aShirts = explode(",", $aBreakCommand[2]);
			$iClubId = $aBreakCommand[0] == 'h' ? $oMatch->home_team_id : $oMatch->away_team_id;
			
			/* Loop through each shirt in each command */
			foreach( $aShirts as $aEachShirt ) {
				
				$sSqlStatement = "SELECT id FROM `player`
					WHERE status = 1 AND deleted = 0 AND current_club_id = $iClubId AND current_shirt_no = $aEachShirt";
				
				$aPlayer = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
				
				if( count($aPlayer) > 0 ) {
					
					$model = new MatchPlayer();
					$model->match_id = $iMatchId;
					$model->player_id = $aPlayer[0]['id'];
					$model->club_id = $iClubId;
					$model->start_11 = $aBreakCommand[1] == 'start' ? 1 : 0;
					$model->shirt_no = $aEachShirt;
					$model->created_date = Helpers::getCurrentTime();
					$model->created_by = $iCurrentUser;
						
					if( !$model->save() ) {
						echo 0;
						return;
					}
				}
			}
		}
		echo 1;
	}
	
	public function actionCommandLineSaveMatchEvent() {
		
		/* Check Authentication */
		if( !$this->checkAuthentication() ) {
			echo 0;
			return;
		}
		
		/* Inputs */
		$iMatchId = $_POST['match_id'];
		$sCommand = $_POST['command'];
		$oMatch = Matches::model()->findByPk($iMatchId);
		$iCurrentUser = Helpers::getUserId( $_COOKIE['ppfantasy_username'] );
		
		/* Loop through each command */
		$aCommands = explode(";", $sCommand);
		$aEventSet = array('g', 'og', 'p(g)', 'p(m)', 'r', 'y', 'y2', 's');
		$aEventId = array(1, 2, 3, 4, 5, 8, 6, 7);
		foreach( $aCommands as $aEachCommand ) {
			
			$aBreakCommand = explode(" ", $aEachCommand);
			
			/* Check command's format */
			if( count($aBreakCommand) != 6 ) {
				echo 2;
				return;
			}
			if( $aBreakCommand[0] != 'h' && $aBreakCommand[0] != 'a' ) {
				echo 3;
				return;
			}
			if( !in_array($aBreakCommand[1], $aEventSet) ) {
				echo 4;
				return;
			}
			
			$iClubId = $aBreakCommand[0] == 'h' ? $oMatch->home_team_id : $oMatch->away_team_id;
			
			/* Find Player 1 */
			$sSqlStatement = "SELECT player_id FROM `match_player`
				WHERE status = 1 AND deleted = 0 
					AND club_id = $iClubId AND shirt_no = $aBreakCommand[2] 
					AND match_id = $iMatchId";
			$aPlayer = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
			$iPlayer1Id = count($aPlayer) == 0 ? -1 : $aPlayer[0]['player_id'];
			
			/* Find Player 2 */
			$iPlayer2Id = 0;
			if( $aBreakCommand[3] != 0 ) {
				$sSqlStatement = "SELECT player_id FROM `match_player`
					WHERE status = 1 AND deleted = 0 
						AND club_id = $iClubId AND shirt_no = $aBreakCommand[3] 
						AND match_id = $iMatchId";
				$aPlayer = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
				$iPlayer2Id = count($aPlayer) == 0 ? -1 : $aPlayer[0]['player_id'];
			}
			
			/* Save */
			if( $iPlayer1Id != -1 && $iPlayer2Id != -1 ) {
				$model = new MatchEvent();
				$model->match_id = $iMatchId;
				$model->club_id = $iClubId;
				$model->player_id = $iPlayer1Id;
				$model->second_player_id = $iPlayer2Id;
				$model->event_id = $aEventId[array_search($aBreakCommand[1], $aEventSet)];
				$model->minute = $aBreakCommand[4] + $aBreakCommand[5];
				$model->period = $aBreakCommand[4] <= 45 ? 1 : 2;
				$model->created_date = Helpers::getCurrentTime();
				$model->created_by = $iCurrentUser;
				if( !$model->save() ) {
					echo 5;
					return;
				}
			}
		}
		
		echo 1;
	}
	
	public function actionCommandLineAddMatch() {
	
		/* Check Authentication */
		if( !$this->checkAuthentication() ) {
			echo 0;
			return;
		}
		
		/* Inputs */
		$sCommand = $_POST['command'];
		$iCurrentUser = Helpers::getUserId( $_COOKIE['ppfantasy_username'] );
		
		/* Loop through each command */
		$aCommands = explode(";", $sCommand);
		$aTeamShort = array('mtu', 'bu', 'bg', 'buriram', 'chon', 'rat', 'chiang', 'suk', 'tero', 'suphan', 'korat', 'pat', 'sis', 'super', 'navy', 'honda', 'ubon', 'port');
		$aTeamId = array(1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18);
		foreach( $aCommands as $aEachCommand ) {
			
			$aBreakCommand = explode(" ", $aEachCommand);
				
			/* Check command's format */
			if( count($aBreakCommand) != 5 ) {
				echo 2;
				return;
			}
			if( !in_array($aBreakCommand[0], $aTeamShort) || !in_array($aBreakCommand[1], $aTeamShort) ) {
				echo 3;
				return;
			}
			
			/* Save */
			$iHomeId = $aTeamId[array_search($aBreakCommand[0], $aTeamShort)];
			$iAwayId = $aTeamId[array_search($aBreakCommand[1], $aTeamShort)];
			$oHomeClub = Club::model()->findByPk($iHomeId);
			$oAwayClub = Club::model()->findByPk($iAwayId);
			$model = new Matches();
			$model->home_team_id = $iHomeId;
			$model->away_team_id = $iAwayId;
			$model->stadium_id = $oHomeClub->main_stadium_id;
			$model->week_id = $aBreakCommand[2];
			$model->home_coach_id = $oHomeClub->current_coach_id;
			$model->away_coach_id = $oAwayClub->current_coach_id;
			$model->kickoff_time = $aBreakCommand[3] . ' ' . $aBreakCommand[4];
			$model->created_date = Helpers::getCurrentTime();
			$model->created_by = $iCurrentUser;
			if( !$model->save() ) {
				echo 4;
				return;
			}
		}
		
		echo 1;
	}
	
	public function actionRenderQuickBestPlayers( $iWeekId = 0 ) {
	
		/* Check Authentication */
		if( !$this->checkAuthentication() ) {
			$this->renderPartial('admin');
			return;
		}
		
		/* Get All Teams */
		$sSqlStatement = "SELECT id, short_name_th AS name FROM `club` WHERE status = 1 AND deleted = 0 ORDER BY short_name_th ASC";
		$aTeams = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		/* Get Best Players */
		$sSqlStatement = "SELECT BEST.id AS id, P.name_th AS name, P.surname_th AS surname, 
				P.called_name_th AS called_name, P.nation_id AS nation, C.short_name_th AS club
			FROM `match_player_best` BEST
				JOIN `player` P ON BEST.player_id = P.id
				JOIN `club` C ON BEST.club_id = C.id
			WHERE BEST.status = 1 AND BEST.deleted = 0 AND BEST.week_id = $iWeekId";
		$aBestPlayers = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
	
		$this->renderPartial('quick_best_players', array(
				'iWeekId' => $iWeekId,
				'aBestPlayers' => $aBestPlayers,
				'aTeams' => $aTeams,
		));
	}
	
	public function actionAddBestPlayer() {
		
		/* Check Authentication */
		if( !$this->checkAuthentication() ) {
			echo 0;
			return;
		}
		
		/* Inputs */
		$iWeekId = $_POST['week_id'];
		$iPlayerId = $_POST['player_id'];
		$iClubId = $_POST['club_id'];
		
		/* Save */
		$model = new MatchPlayerBest();
		$model->week_id = $iWeekId;
		$model->player_id = $iPlayerId;
		$model->club_id = $iClubId;
		$model->created_date = Helpers::getCurrentTime();
		$model->created_by = Helpers::getUserId( $_COOKIE['ppfantasy_username'] );
		
		if( !$model->save() ) {
			echo 0;
			return;
		}
		
		echo 1;
	}
	
	public function actionRemovePlayerBest() {
		
		/* Check Authentication */
		if( !$this->checkAuthentication() ) {
			echo 0;
			return;
		}
		
		$iBestId = $_POST['id'];
		MatchPlayerBest::model()->updateByPk( $iBestId, array(
				'deleted' => 1,
				'modified_date' => Helpers::getCurrentTime(),
				'modified_by' => Helpers::getUserId( $_COOKIE['ppfantasy_username'] )
		) );
		
		echo 1;
	}
	
	public function actionCommandLineSaveMatchSave() {
	
		/* Check Authentication */
		if( !$this->checkAuthentication() ) {
			echo 0;
			return;
		}
	
		/* Inputs */
		$iMatchId = $_POST['match_id'];
		$sCommand = $_POST['command'];
		$oMatch = Matches::model()->findByPk($iMatchId);
		$iCurrentUser = Helpers::getUserId( $_COOKIE['ppfantasy_username'] );
	
		/* Loop through each command */
		$aCommands = explode(";", $sCommand);
		foreach( $aCommands as $aEachCommand ) {
				
			$aBreakCommand = explode(" ", $aEachCommand);
				
			/* Check command's format */
			if( count($aBreakCommand) != 3 ) {
				echo 2;
				return;
			}
			if( $aBreakCommand[0] != 'h' && $aBreakCommand[0] != 'a' ) {
				echo 3;
				return;
			}
				
			$iClubId = $aBreakCommand[0] == 'h' ? $oMatch->home_team_id : $oMatch->away_team_id;
			$iShirtNo = $aBreakCommand[1];
			
			$sSqlStatement = "SELECT player_id
				FROM `match_player`
				WHERE status = 1 AND deleted = 0 AND match_id = $iMatchId AND club_id = $iClubId AND shirt_no = $iShirtNo";
			
			$aPlayer = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
			
			if( count($aPlayer) == 0 )
				continue;
			
			$model = new MatchSave();
			$model->match_id = $iMatchId;
			$model->club_id = $iClubId;
			$model->player_id = $aPlayer[0]['player_id'];
			$model->total_saved = $aBreakCommand[2];
			$model->created_date = Helpers::getCurrentTime();
			$model->created_by = $iCurrentUser;
			
			if( !$model->save() ) {
				echo 4;
				return;
			}
		}
		
		echo 1;
	}
	
	public function actionClearMatchSave() {
		
		/* Check Authentication */
		if( !$this->checkAuthentication() ) {
			echo 0;
			return;
		}
		
		/* Inputs */
		$iMatchId = $_POST['match_id'];
		$iCurrentUser = Helpers::getUserId( $_COOKIE['ppfantasy_username'] );
		$sCurrentDate = Helpers::getCurrentTime();
		
		$sSqlStatement = "UPDATE `match_save` 
			SET deleted = 1,
				modified_date = $sCurrentDate,
				modified_by = $iCurrentUser
			WHERE status = 1 AND deleted = 0 AND match_id = $iMatchId";
		Yii::app()->db->createCommand($sSqlStatement)->execute();
		
		echo 1;
	}
	
	public function actionEditMatchEventShoot() {
		
		/* Check Authentication */
		if( !$this->checkAuthentication() ) {
			echo 0;
			return;
		}
		
		/* Inputs */
		$sTextShoot = $_POST['text_shoot'];
		$sMeId = $_POST['me_id'];
		$oMatchEvent = MatchEvent::model()->findByPk($sMeId);
		$aTextShoot = explode(",", $sTextShoot);
		
		/* Check Input */
		if( count($aTextShoot) != 5 ) {
			echo 2;
			return;
		}
		
		/* Find P2's player_id */
		$iClubId = $oMatchEvent->club_id;
		$iShirtNo = $aTextShoot[0];
		$iMatchId = $oMatchEvent->match_id;
		$sSqlStatement = "SELECT player_id FROM `match_player`
			WHERE status = 1 AND deleted = 0
				AND club_id = $iClubId AND shirt_no = $iShirtNo
				AND match_id = $iMatchId";
		$aPlayer = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		$iPlayer2Id = count($aPlayer) == 0 ? 0 : $aPlayer[0]['player_id'];
		
		/* Save */
		$iCurrentUser = Helpers::getUserId( $_COOKIE['ppfantasy_username'] );
		$sCurrentDate = Helpers::getCurrentTime();
		$sSqlStatement = "UPDATE `match_event` 
			SET second_player_id = $iPlayer2Id, 
				area_of_shoot = $aTextShoot[1],
				shoot_by = $aTextShoot[2],
				is_freekick = $aTextShoot[3],
				part_of_goal_shot = $aTextShoot[4],
				modified_date = '$sCurrentDate',
				modified_by = $iCurrentUser
			WHERE id = $sMeId";
		Yii::app()->db->createCommand($sSqlStatement)->execute();
		
		echo 1;
	}
	
	public function actionSaveMatchCoach() {
		
		/* Check Authentication */
		if( !$this->checkAuthentication() ) {
			echo 0;
			return;
		}
		
		/* Inputs */
		$iMatchId = $_POST['match_id'];
		$iHomeCoach = $_POST['home_coach'];
		$iAwayCoach = $_POST['away_coach'];
		
		Matches::model()->updateByPk( $iMatchId, array(
				'home_coach_id' => $iHomeCoach,
				'away_coach_id' => $iAwayCoach,
				'modified_date' => Helpers::getCurrentTime(),
				'modified_by' => Helpers::getUserId( $_COOKIE['ppfantasy_username'] ),
		) );
		
		echo 1;
	}
	
	public function calculatePlayerPoint($iWeekId) {
		
		/* Global used variables */
		$iCurrentUser = Helpers::getUserId( $_COOKIE['ppfantasy_username'] );
		$sCurrentDate = Helpers::getCurrentTime();
		
		/* Delete the old ones */
		$sSqlStatement = "UPDATE `player_point`
			SET deleted = 1,
				modified_date = '$sCurrentDate',
				modified_by = $iCurrentUser
			WHERE status = 1 AND deleted = 0 AND week_id = $iWeekId";
		Yii::app()->db->createCommand($sSqlStatement)->execute();
		
		/* Point for the type related to Minute Played */
		$sSqlStatement = "SELECT MP.player_id AS player_id, MP.start_11 AS start_11, 
				M.added_min_first_half AS added_min_1st, M.added_min_second_half AS added_min_2nd,
				P.player_position_id AS player_position, 
				MP.match_id AS match_id, MP.club_id AS club_id
			FROM `match_player` MP 
				JOIN `matches` M ON MP.match_id = M.id
				JOIN `player` P ON MP.player_id = P.id
			WHERE MP.status = 1 AND MP.deleted = 0 AND M.week_id = $iWeekId";
		$aPlayer = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		for( $i = 0; $i < count($aPlayer); $i++ ) {
			
			$aGetPlayerMinute = $this->getPlayerPlayedMinuteInWeek($aPlayer[$i], $iWeekId);
			
			$aPlayer[$i]['minute_played'] = $aGetPlayerMinute['minute_played'];
			
			if( $aPlayer[$i]['minute_played'] == 0 )
				continue;
			
			/* Save Minute Played Point Type */
			$model = new PlayerPoint();
			$model->player_id = $aPlayer[$i]['player_id'];
			$model->point_type_id = $aPlayer[$i]['minute_played'] >= 60 ? 2 : 1;
			$model->total_point = $aPlayer[$i]['minute_played'] >= 60 ? 2 : 1;
			$model->week_id = $iWeekId;
			$model->created_date = $sCurrentDate;
			$model->created_by = $iCurrentUser;
			$model->save();
			
			/* Save Clean Sheet */
			if( $aPlayer[$i]['minute_played'] >= 60 && $aPlayer[$i]['player_position'] != 4 &&
				$this->isCleanSheetInWeek($aPlayer[$i], $aGetPlayerMinute['minute_in'], $aGetPlayerMinute['minute_out']) ) {
				
				$model = new PlayerPoint();
				$model->player_id = $aPlayer[$i]['player_id'];
				$model->point_type_id = in_array($aPlayer[$i]['player_position'], array(1,2)) ? 10 : 16;
				$model->total_point = in_array($aPlayer[$i]['player_position'], array(1,2)) ? 4 : 3;
				$model->week_id = $iWeekId;
				$model->created_date = $sCurrentDate;
				$model->created_by = $iCurrentUser;
				$model->save();
			}
		}
		
		/* Assist */
		$sSqlStatement = "SELECT ME.second_player_id AS player_id, COUNT(ME.id) AS total_assist
			FROM `match_event` ME JOIN `matches` M ON ME.match_id = M.id
			WHERE ME.status = 1 AND ME.deleted = 0 AND 
				M.week_id = $iWeekId AND ME.event_id = 1 AND ME.second_player_id <> 0
			GROUP BY ME.second_player_id";
		$aAssist = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		foreach( $aAssist as $aEachAssist ) {
			$model = new PlayerPoint();
			$model->player_id = $aEachAssist['player_id'];
			$model->point_type_id = 3;
			$model->total_point = 3 * $aEachAssist['total_assist'];
			$model->week_id = $iWeekId;
			$model->count = $aEachAssist['total_assist'];
			$model->created_date = $sCurrentDate;
			$model->created_by = $iCurrentUser;
			$model->save();
		}
		
		/* Bonus */
		$sSqlStatement = "SELECT player_id
			FROM `match_player_best`
			WHERE status = 1 AND deleted = 0 AND week_id = $iWeekId";
		$aBonus = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		foreach( $aBonus as $aEachBonus ) {
			$model = new PlayerPoint();
			$model->player_id = $aEachBonus['player_id'];
			$model->point_type_id = 5;
			$model->total_point = 3;
			$model->week_id = $iWeekId;
			$model->created_date = $sCurrentDate;
			$model->created_by = $iCurrentUser;
			$model->save();
		}
		
		/* Yellow Card */
		$sSqlStatement = "SELECT ME.player_id AS player_id
			FROM `match_event` ME JOIN `matches` M ON ME.match_id = M.id
			WHERE ME.status = 1 AND ME.deleted = 0 AND 
				M.week_id = $iWeekId AND ME.event_id IN (6,8)";
		$aYellow = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		foreach( $aYellow as $aEachYellow ) {
			$model = new PlayerPoint();
			$model->player_id = $aEachYellow['player_id'];
			$model->point_type_id = 6;
			$model->total_point = -1;
			$model->week_id = $iWeekId;
			$model->created_date = $sCurrentDate;
			$model->created_by = $iCurrentUser;
			$model->save();
		}
		
		/* Red Card */
		$sSqlStatement = "SELECT ME.player_id AS player_id
			FROM `match_event` ME JOIN `matches` M ON ME.match_id = M.id
			WHERE ME.status = 1 AND ME.deleted = 0 AND
				M.week_id = $iWeekId AND ME.event_id = 5";
		$aRed = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		foreach( $aRed as $aEachRed ) {
			$model = new PlayerPoint();
			$model->player_id = $aEachRed['player_id'];
			$model->point_type_id = 7;
			$model->total_point = -3;
			$model->week_id = $iWeekId;
			$model->created_date = $sCurrentDate;
			$model->created_by = $iCurrentUser;
			$model->save();
		}
		
		/* Own Goal */
		$sSqlStatement = "SELECT ME.player_id AS player_id
			FROM `match_event` ME JOIN `matches` M ON ME.match_id = M.id
			WHERE ME.status = 1 AND ME.deleted = 0 AND
				M.week_id = $iWeekId AND ME.event_id = 2";
		$aOg = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		foreach( $aOg as $aEachOg ) {
			$model = new PlayerPoint();
			$model->player_id = $aEachOg['player_id'];
			$model->point_type_id = 8;
			$model->total_point = -2;
			$model->week_id = $iWeekId;
			$model->created_date = $sCurrentDate;
			$model->created_by = $iCurrentUser;
			$model->save();
		}
		
		/* Scorer */
		$sSqlStatement = "SELECT ME.player_id AS player_id, P.player_position_id AS position,
				COUNT(ME.id) AS total_score
			FROM `match_event` ME 
				JOIN `matches` M ON ME.match_id = M.id
				JOIN `player` P ON ME.player_id = P.id
			WHERE ME.status = 1 AND ME.deleted = 0 AND
				M.week_id = $iWeekId AND ME.event_id IN (1,3)
			GROUP BY ME.player_id";
		$aScorer = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		foreach( $aScorer as $aEachScorer ) {
			$model = new PlayerPoint();
			$model->player_id = $aEachScorer['player_id'];
			
			if( $aEachScorer['position'] == 1 ) {
				$model->point_type_id = 9;
				$model->total_point = 8 * $aEachScorer['total_score'];
			}
			else if( $aEachScorer['position'] == 2 ) {
				$model->point_type_id = 14;
				$model->total_point = 6 * $aEachScorer['total_score'];
			}
			else if( $aEachScorer['position'] == 3 ) {
				$model->point_type_id = 15;
				$model->total_point = 4 * $aEachScorer['total_score'];
			}
			else {
				$model->point_type_id = 17;
				$model->total_point = 4 * $aEachScorer['total_score'];
			}
			
			$model->count = $aEachScorer['total_score']; 
			$model->week_id = $iWeekId;
			$model->created_date = $sCurrentDate;
			$model->created_by = $iCurrentUser;
			$model->save();
		}
		
		/* Man of the Match */
		$sSqlStatement = "SELECT man_of_the_match
			FROM `matches` M
			WHERE status = 1 AND deleted = 0 AND 
				week_id = $iWeekId";
		$aManOfTheMatch = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		foreach( $aManOfTheMatch as $aEachMOTM ) {
			$model = new PlayerPoint();
			$model->player_id = $aEachMOTM['man_of_the_match'];
			$model->point_type_id = 18;
			$model->total_point = 3;
			$model->week_id = $iWeekId;
			$model->created_date = $sCurrentDate;
			$model->created_by = $iCurrentUser;
			$model->save();
		}
		
		/* Penalty Miss */
		$sSqlStatement = "SELECT ME.player_id AS player_id, COUNT(ME.id) AS total_miss
			FROM `match_event` ME JOIN `matches` M ON ME.match_id = M.id
			WHERE ME.status = 1 AND ME.deleted = 0 AND
				M.week_id = $iWeekId AND ME.event_id = 4
			GROUP BY ME.player_id";
		$aPenaltyMiss = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		foreach( $aPenaltyMiss as $aEachPenMiss ) {
			$model = new PlayerPoint();
			$model->player_id = $aEachPenMiss['player_id'];
			$model->point_type_id = 4;
			$model->total_point = -2 * $aEachPenMiss['total_miss'];
			$model->count = $aEachPenMiss['total_miss'];
			$model->week_id = $iWeekId;
			$model->created_date = $sCurrentDate;
			$model->created_by = $iCurrentUser;
			$model->save();
		}
		
		/* Save */
		$sSqlStatement = "SELECT MS.player_id AS player_id, MS.total_saved AS total_saved
			FROM `match_save` MS JOIN `matches` M ON MS.match_id = M.id
			WHERE MS.status = 1 AND MS.deleted = 0 AND M.week_id = $iWeekId AND MS.total_saved >= 2";
		$aSaved = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		foreach( $aSaved as $aEachSaved ) {
			$model = new PlayerPoint();
			$model->player_id = $aEachSaved['player_id'];
			$model->point_type_id = 11;
			$model->total_point = floor($aEachSaved['total_saved'] / 2);
			$model->count = floor($aEachSaved['total_saved'] / 2);
			$model->week_id = $iWeekId;
			$model->created_date = $sCurrentDate;
			$model->created_by = $iCurrentUser;
			$model->save();
		}
		
		/* Save Penalty */
		$sSqlStatement = "SELECT ME.second_player_id AS player_id, COUNT(ME.id) AS total_save
			FROM `match_event` ME JOIN `matches` M ON ME.match_id = M.id
			WHERE ME.status = 1 AND ME.deleted = 0 AND
				M.week_id = $iWeekId AND ME.event_id = 4
			GROUP BY ME.player_id";
		$aPenaltySave = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		foreach( $aPenaltySave as $aEachPenSave ) {
			$model = new PlayerPoint();
			$model->player_id = $aEachPenSave['player_id'];
			$model->point_type_id = 12;
			$model->total_point = 5 * $aEachPenSave['total_save'];
			$model->count = $aEachPenSave['total_save'];
			$model->week_id = $iWeekId;
			$model->created_date = $sCurrentDate;
			$model->created_by = $iCurrentUser;
			$model->save();
		}
		
		/* Shot */
		
		// Get All Players
		$sSqlStatement = "SELECT MP.player_id AS player_id, MP.match_id AS match_id,
				MP.club_id AS club_id, MP.start_11 AS start_11
			FROM `match_player` MP 
				JOIN `player` P ON MP.player_id = P.id
				JOIN `matches` M ON MP.match_id = M.id
			WHERE MP.status = 1 AND MP.deleted = 0 AND M.week_id = $iWeekId AND 
				P.player_position_id IN (1,2)";
		$aPlayersForShot = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		// Get Player Minute of In and Out
		for( $i = 0; $i < count($aPlayersForShot); $i++ ) {
			
			$aPlayersForShot[$i]['total_shot'] = 0;
			$aPlayersForShot[$i]['period_in'] = 0;
			$aPlayersForShot[$i]['period_out'] = 0;
			$aPlayersForShot[$i]['minute_in'] = 0;
			$aPlayersForShot[$i]['minute_out'] = 0;
			
			if( $aPlayersForShot[$i]['start_11'] == 1 ) {
				$aPlayersForShot[$i]['period_in'] = 1;
				$aPlayersForShot[$i]['minute_in'] = 0;
				$aPlayersForShot[$i]['period_out'] = 2;
				$aPlayersForShot[$i]['minute_out'] = 1000;
			}
			
			$iPlayerId = $aPlayersForShot[$i]['player_id'];
			$iMatchId = $aPlayersForShot[$i]['match_id'];
			$sSqlStatement = "SELECT period, minute
				FROM `match_event`
				WHERE status = 1 AND deleted = 0 AND event_id = 7 AND 
					player_id = $iPlayerId AND match_id = $iMatchId";
			$aIn = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
			if( count($aIn) > 0 ) {
				$aPlayersForShot[$i]['period_in'] = $aIn[0]['period'];
				$aPlayersForShot[$i]['minute_in'] = $aIn[0]['minute'];
				$aPlayersForShot[$i]['period_out'] = 2;
				$aPlayersForShot[$i]['minute_out'] = 1000;
			}
			
			$sSqlStatement = "SELECT period, minute
				FROM `match_event`
				WHERE status = 1 AND deleted = 0 AND event_id = 7 AND
					second_player_id = $iPlayerId AND match_id = $iMatchId";
			$aOut = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
			if( count($aOut) > 0 ) {
				$aPlayersForShot[$i]['period_out'] = $aOut[0]['period'];
				$aPlayersForShot[$i]['minute_out'] = $aOut[0]['minute'];
			}
		}
		
		// Get shot events
		$sSqlStatement = "SELECT ME.match_id AS match_id, ME.club_id AS club_id, 
				ME.minute AS minute, ME.period AS period, ME.event_id AS event_id
			FROM `match_event` ME JOIN `matches` M ON ME.match_id = M.id
			WHERE ME.status = 1 AND ME.deleted = 0 AND ME.event_id IN (1,2,3) AND M.week_id = $iWeekId";
		$aEventsShot = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		foreach( $aEventsShot as $aEachEvent ) {
			for( $i = 0; $i < count($aPlayersForShot); $i++ ) {
				if( $aPlayersForShot[$i]['match_id'] == $aEachEvent['match_id'] ) {
					
					$iVirtualEventMinute = $aEachEvent['period'] == 1 ? $aEachEvent['minute'] : $aEachEvent['minute'] + 100;
					$iVlrtualPlayerMinuteIn = $aPlayersForShot[$i]['period_in'] == 1 ? $aPlayersForShot[$i]['minute_in'] : $aPlayersForShot[$i]['minute_in'] + 100;
					$iVlrtualPlayerMinuteOut = $aPlayersForShot[$i]['period_out'] == 1 ? $aPlayersForShot[$i]['minute_out'] : $aPlayersForShot[$i]['minute_out'] + 100;
				
					if( $iVlrtualPlayerMinuteIn <= $iVirtualEventMinute && $iVlrtualPlayerMinuteOut >= $iVirtualEventMinute ) {
						
						if( $aEachEvent['event_id'] == 1 && $aEachEvent['club_id'] != $aPlayersForShot[$i]['club_id'] )
							$aPlayersForShot[$i]['total_shot']++;
						else if( $aEachEvent['event_id'] == 2 && $aEachEvent['club_id'] == $aPlayersForShot[$i]['club_id'] )
							$aPlayersForShot[$i]['total_shot']++;
						else if( $aEachEvent['event_id'] == 3 && $aEachEvent['club_id'] != $aPlayersForShot[$i]['club_id'] )
							$aPlayersForShot[$i]['total_shot']++;
					}
				}
			}
		}
		
		// Save
		foreach( $aPlayersForShot as $aEachPlayer ) {
			if( $aEachPlayer['total_shot'] >= 2 ) {
				$model = new PlayerPoint();
				$model->player_id = $aEachPlayer['player_id'];
				$model->point_type_id = 13;
				$model->total_point = floor($aEachPlayer['total_shot'] / 2) * -1;
				$model->count = floor($aEachPlayer['total_shot'] / 2);
				$model->week_id = $iWeekId;
				$model->created_date = $sCurrentDate;
				$model->created_by = $iCurrentUser;
				$model->save();
			}
		}
		
		echo 1;
	}
	
	private function isCleanSheetInWeek( $aPlayer, $iMinuteIn, $iMinuteOut ) {
		
		$iMatchId = $aPlayer['match_id'];
		$iClubId = $aPlayer['club_id'];
		$iPlayerId = $aPlayer['player_id'];
		$iAddedMin1st = $aPlayer['added_min_1st'] == null ? 0 : $aPlayer['added_min_1st'];
		$iAddedMin2nd = $aPlayer['added_min_2nd'] == null ? 0 : $aPlayer['added_min_2nd'];
		
		$sSqlStatement = "SELECT minute, period
			FROM `match_event`
			WHERE status = 1 AND deleted = 0 AND match_id = $iMatchId AND 
				(	(event_id = 1 AND club_id <> $iClubId) OR
					(event_id = 2 AND club_id = $iClubId) OR
					(event_id = 3 AND club_id <> $iClubId) )";
		
		$aEvents = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		if( count($aEvents) == 0 )
			return true;
	
		foreach( $aEvents as $aEachEvent ) {
			if( $aEachEvent['period'] == 1 && $aEachEvent['minute'] <= 45 + $iAddedMin1st )
				$iRealMinute = $aEachEvent['minute'];
			else if( $aEachEvent['period'] == 1 )
				$iRealMinute = 45 + $iAddedMin1st;
			else if( $aEachEvent['minute'] <= 90 + $iAddedMin2nd )
				$iRealMinute = $aEachEvent['minute'] + $iAddedMin1st;
			else
				$iRealMinute = 90 + $iAddedMin1st + $iAddedMin2nd;
			
			if( $iRealMinute >= $iMinuteIn && $iRealMinute <= $iMinuteOut )
				return false;
		}
		
		return true;
	}
	
	private function getPlayerPlayedMinuteInWeek( $aPlayer, $iWeekId ) {
		
		$aResultToReturn = array();
		
		$iPlayerId = $aPlayer['player_id'];
		$iAddedMin1st = $aPlayer['added_min_1st'] == null ? 0 : $aPlayer['added_min_1st'];
		$iAddedMin2nd = $aPlayer['added_min_2nd'] == null ? 0 : $aPlayer['added_min_2nd'];
			
		if( $aPlayer['start_11'] == 1 ) {
		
			$sSqlStatement = "SELECT ME.minute AS minute, ME.period AS period
				FROM `match_event` ME JOIN `matches` M ON ME.match_id = M.id
				WHERE ME.status = 1 AND ME.deleted = 0 AND
					M.week_id = $iWeekId AND ME.event_id = 7 AND ME.second_player_id = $iPlayerId";
			$aResult = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
			if( count($aResult) == 0 )
				$aResultToReturn['minute_played'] = 90 + $iAddedMin1st + $iAddedMin2nd;
			else if( $aResult[0]['period'] == 1 )
				$aResultToReturn['minute_played'] = $aResult[0]['minute'] > (45 + $iAddedMin1st) ? (45 + $iAddedMin1st) : $aResult[0]['minute'];
			else
				$aResultToReturn['minute_played'] = $aResult[0]['minute'] > (90 + $iAddedMin2nd) ? (90 + $iAddedMin2nd + $iAddedMin1st) : $aResult[0]['minute'] + $iAddedMin1st;
			
			$aResultToReturn['minute_in'] = 0;
			$aResultToReturn['minute_out'] = $aResultToReturn['minute_played'];
		}
		else {
			$sSqlStatement = "SELECT ME.minute AS minute, ME.period AS period
				FROM `match_event` ME JOIN `matches` M ON ME.match_id = M.id
				WHERE ME.status = 1 AND ME.deleted = 0 AND
					M.week_id = $iWeekId AND ME.event_id = 7 AND ME.player_id = $iPlayerId";
			$aIn = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
			$sSqlStatement = "SELECT ME.minute AS minute, ME.period AS period
				FROM `match_event` ME JOIN `matches` M ON ME.match_id = M.id
				WHERE ME.status = 1 AND ME.deleted = 0 AND
					M.week_id = $iWeekId AND ME.event_id = 7 AND ME.second_player_id = $iPlayerId";
			$aOut = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
			if( count($aIn) == 0 ) {
				$aResultToReturn['minute_played'] = 0;
				$aResultToReturn['minute_in'] = 0;
				$aResultToReturn['minute_out'] = 0;
				return $aResultToReturn;
			}
		
			if( $aIn[0]['period'] == 1 )
				$iMinIn = $aIn[0]['minute'] > 45 + $iAddedMin1st ? 45 + $iAddedMin1st : $aIn[0]['minute'];
			else {
				$iMinIn = $aIn[0]['minute'] > 90 + $iAddedMin2nd ? 90 + $iAddedMin2nd : $aIn[0]['minute'];
				$iMinIn += $iAddedMin1st;
			}
		
			if( count($aOut) > 0 ) {
				if( $aOut[0]['period'] == 1 )
					$iMinOut = $aOut[0]['minute'] > 45 + $iAddedMin1st ? 45 + $iAddedMin1st : $aOut[0]['minute'];
				else {
					$iMinOut = $aOut[0]['minute'] > 90 + $iAddedMin2nd ? 90 + $iAddedMin2nd : $aOut[0]['minute'];
					$iMinOut += $iAddedMin1st;
				}
			}
			else
				$iMinOut = 90 + $iAddedMin1st + $iAddedMin2nd;
		
			$aResultToReturn['minute_played'] = $iMinOut - $iMinIn;
			$aResultToReturn['minute_in'] = $iMinIn;
			$aResultToReturn['minute_out'] = $iMinOut;
		}
		
		return $aResultToReturn;
	}
	
	public function actionUpdatePlayerIdForPlayerTotalPoint() {
		
		set_time_limit(100);
		
		$iCurrentUser = Helpers::getUserId( $_COOKIE['ppfantasy_username'] );
		$sCurrentDate = Helpers::getCurrentTime();
		
		/* Get old Player_Total_Point */
		$sSqlStatement = "SELECT player_id FROM `player_total_point`
			WHERE status = 1 AND deleted = 0";
		$aQuery = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		$aOldPTP = array();
		for( $i = 0; $i < count($aQuery); $i++ ) {
			$aOldPTP[$i] = $aQuery[$i]['player_id'];
		}
		
		/* Get all players in Player */
		$sSqlStatement = "SELECT id FROM `player`
			WHERE status = 1 AND deleted = 0";
		$aQuery = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		$aPlayers = array();
		for( $i = 0; $i < count($aQuery); $i++ ) {
			$aPlayers[$i] = $aQuery[$i]['id'];
		}
		
		/* Add new player to Player_Total_Point */
		$aNewPTP = array_diff($aPlayers, $aOldPTP);
		foreach( $aNewPTP as $aEachPTP ) {
			$model = new PlayerTotalPoint();
			$model->player_id = $aEachPTP;
			$model->created_date = $sCurrentDate;
			$model->created_by = $iCurrentUser;
			$model->save();
		}
		
		echo 1;
	}
	
	public function actionCalculatePlayerPoint() {
		
		set_time_limit(100);
		
		$iWeekId = $_POST['week_id'];
		
		/* Calculate point and save to Player_Point */
		$this->calculatePlayerPoint($iWeekId);
		
		echo 1;
	}
	
	public function actionCalculatePlayerTotalPoint() {
	
		set_time_limit(100);
	
		$sAllWeeks = $_POST['all_week_ids'];
		$sAllLastWeekIds = $_POST['all_lasts_week_ids'];
		$iCurrentUser = Helpers::getUserId( $_COOKIE['ppfantasy_username'] );
		$sCurrentDate = Helpers::getCurrentTime();
	
		/* Calculate total point */
		$sSqlStatement = "SELECT player_id, SUM(total_point) AS total_point
			FROM `player_point`
			WHERE status = 1 AND deleted = 0 AND week_id IN ($sAllWeeks)
			GROUP BY player_id";
		$aQuery = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
	
		foreach( $aQuery as $aEach ) {
			$iTotalPoint = $aEach['total_point'];
			$iPlayerId = $aEach['player_id'];
			$sSqlStatement = "UPDATE `player_total_point`
				SET total_point = $iTotalPoint,
					modified_date = '$sCurrentDate',
					modified_by = $iCurrentUser
				WHERE status = 1 AND deleted = 0 AND player_id = $iPlayerId";
			Yii::app()->db->createCommand($sSqlStatement)->execute();
		}
	
		/* Calculate points for last 5 weeks */
		$sSqlStatement = "SELECT player_id, SUM(total_point) AS total_point
			FROM `player_point`
			WHERE status = 1 AND deleted = 0 AND week_id IN ($sAllLastWeekIds)
			GROUP BY player_id";
		$aQuery = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
	
		foreach( $aQuery as $aEach ) {
			$iLast5WeeksPoint = $aEach['total_point'];
			$iPlayerId = $aEach['player_id'];
			$sSqlStatement = "UPDATE `player_total_point`
				SET last_5_weeks_point = $iLast5WeeksPoint,
					modified_date = '$sCurrentDate',
					modified_by = $iCurrentUser
				WHERE status = 1 AND deleted = 0 AND player_id = $iPlayerId";
			Yii::app()->db->createCommand($sSqlStatement)->execute();
		}
	
		echo 1;
	}
	
	public function actionUpdatePointUserMyXi() {
		
		$iWeekId = $_POST['week_id'];
		$iCurrentUser = Helpers::getUserId( $_COOKIE['ppfantasy_username'] );
		$sCurrentDate = Helpers::getCurrentTime();
		
		/* Get all User_My_Xi */
		$sSqlStatement = "SELECT id, player_id, captain
			FROM `user_my_xi`
			WHERE status = 1 AND deleted = 0 AND week_id = $iWeekId";
		$aUserMyXi = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		/* Get Player Point */
		for( $i = 0; $i < count($aUserMyXi); $i++ ) {
			$iPlayerId = $aUserMyXi[$i]['player_id'];
			$sSqlStatement = "SELECT SUM(total_point) AS total_point
				FROM `player_point`
				WHERE status = 1 AND deleted = 0 AND week_id = $iWeekId AND player_id = $iPlayerId
				GROUP BY player_id";
			$aQuery = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
			
			if( count($aQuery) == 0 )
				$aUserMyXi[$i]['point'] = 0;
			else if( $aUserMyXi[$i]['captain'] == 1 )
				$aUserMyXi[$i]['point'] = $aQuery[0]['total_point'] * 2;
			else
				$aUserMyXi[$i]['point'] = $aQuery[0]['total_point'];
			
			UserMyXi::model()->updateByPk( $aUserMyXi[$i]['id'], array(
					'point' => $aUserMyXi[$i]['point'],
					'modified_date' => $sCurrentDate,
					'modified_by' => $iCurrentUser
			) );
		}
		
		echo 1;
	}
	
	public function actionCopyUserMyXiToWeek() {
		
		$iFromWeekId = $_POST['from_week_id'];
		$iToWeekId = $_POST['to_week_id'];
		$iCurrentUser = Helpers::getUserId( $_COOKIE['ppfantasy_username'] );
		$sCurrentDate = Helpers::getCurrentTime();
		
		$sSqlStatement = "SELECT user_id, player_id, in_11, sub, captain
			FROM `user_my_xi`
			WHERE status = 1 AND deleted = 0 AND week_id = $iFromWeekId";
		$aFromWeek = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		foreach( $aFromWeek as $aEach ) {
			
			$model = new UserMyXi();
			$model->user_id = $aEach['user_id'];
			$model->player_id = $aEach['player_id'];
			$model->in_11 = $aEach['in_11'];
			$model->sub = $aEach['sub'];
			$model->captain = $aEach['captain'];
			$model->week_id = $iToWeekId;
			$model->created_date = $sCurrentDate;
			$model->created_by = $iCurrentUser;
			$model->save();
		}
		
		echo 1;
	}
	
	public function actionQuota2ForNextWeek() {
		
		$iLastWeekId = $_POST['last_week_id'];
		$iCurrentUser = Helpers::getUserId( $_COOKIE['ppfantasy_username'] );
		$sCurrentDate = Helpers::getCurrentTime();
		
		$sSqlStatement = "SELECT user_id
			FROM `user_my_xi`
			WHERE status = 1 AND deleted = 0 AND week_id = $iLastWeekId
			GROUP BY user_id";
		$aUser = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		$sUsers = "";
		foreach( $aUser as $aEachUser ) {
			if( $sUsers == "" )
				$sUsers = $aEachUser['user_id'];
			else 
				$sUsers = $sUsers . ',' . $aEachUser['user_id'];
		}
		
		if( $sUsers != "" ) {
			$sSqlStatement = "UPDATE `user_move_quota`
				SET week_move_left = 2,
					modified_date = '$sCurrentDate',
					modified_by = $iCurrentUser
				WHERE status = 1 AND deleted = 0 AND user_id IN ($sUsers)";
			Yii::app()->db->createCommand($sSqlStatement)->execute();
		}
		
		echo 1;
	}
	
	public function actionResetQuotaToTwo() {
		
		$iCurrentUser = Helpers::getUserId( $_COOKIE['ppfantasy_username'] );
		$sCurrentDate = Helpers::getCurrentTime();
		
		$sSqlStatement = "UPDATE `user_move_quota`
			SET reset_move_left = 2,
				modified_date = '$sCurrentDate',
				modified_by = $iCurrentUser
			WHERE status = 1 AND deleted = 0 AND reset_move_left <> 2";
		Yii::app()->db->createCommand($sSqlStatement)->execute();
		
		echo 1;
	}
	
	public function actionSetConfigValue() {
		
		$sInput = $_POST['input'];
		$iCurrentUser = Helpers::getUserId( $_COOKIE['ppfantasy_username'] );
		$sCurrentDate = Helpers::getCurrentTime();
		
		$aCommands = explode("|", $sInput);
		foreach( $aCommands as $aEachCommand ) {
			$aExploded = explode(",", $aEachCommand);
			$sKey = $aExploded[0];
			$sValue = $aExploded[1];
			
			$sSqlStatement = "UPDATE `configs`
				SET config_value = '$sValue',
					modified_date = '$sCurrentDate',
					modified_by = $iCurrentUser
				WHERE status = 1 AND deleted = 0 AND config_key = '$sKey'";
			Yii::app()->db->createCommand($sSqlStatement)->execute();
		}
		
		echo 1;
	}
	
	public function actionRenderQuickScoreTable() {
	
		/* Check Authentication */
		if( !$this->checkAuthentication() ) {
			$this->renderPartial('admin');
			return;
		}
		
		$iCurrentSeason = Helpers::getConfigValue('latest_season');
		
		/* Get Table Score From Matches */
		$sSqlStatement = "SELECT M.home_team_id AS home_team_id, M.away_team_id AS away_team_id, 
				M.home_score AS home_score, M.away_score AS away_score,
				C1.name_th AS home_team_name, C2.name_th AS away_team_name
			FROM `matches` M 
				JOIN `week` W ON M.week_id = W.id
				JOIN `club` C1 ON M.home_team_id = C1.id
				JOIN `club` C2 ON M.away_team_id = C2.id
			WHERE M.status = 1 AND M.deleted = 0 AND M.home_score IS NOT NULL AND
				W.tournament_id = 1 AND W.season_id = $iCurrentSeason";
		$aMatches = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		$aClubId = array();
		$aPoint = array();
		$aGd = array();
		$aGf = array();
		$aClubIdUnsort = array();
		$aTable = array();
		$i = 0;
		foreach( $aMatches as $aEachMatch ) {
			
			$iIndexHome = array_search($aEachMatch['home_team_id'], $aClubId);
			$iIndexAway = array_search($aEachMatch['away_team_id'], $aClubId);
			
			if( $iIndexHome !== false ) {
				
				if( $aEachMatch['home_score'] > $aEachMatch['away_score'] )
					$aPoint[$iIndexHome] += 3;
				else if( $aEachMatch['home_score'] == $aEachMatch['away_score'] )
					$aPoint[$iIndexHome] += 1;
				
				$aGd[$iIndexHome] += ( $aEachMatch['home_score'] - $aEachMatch['away_score'] );
				$aGf[$iIndexHome] += $aEachMatch['home_score'];
				
				$aTable[$iIndexHome]['P']++;
				$aTable[$iIndexHome]['GF'] += $aEachMatch['home_score'];
				$aTable[$iIndexHome]['GA'] += $aEachMatch['away_score'];
				
				if( $aEachMatch['home_score'] > $aEachMatch['away_score'] )
					$aTable[$iIndexHome]['W']++;
				else if( $aEachMatch['home_score'] == $aEachMatch['away_score'] )
					$aTable[$iIndexHome]['D']++;
				else
					$aTable[$iIndexHome]['L']++;
			}
			else {
				array_push($aClubId, $aEachMatch['home_team_id']);
				array_push($aClubIdUnsort, $aEachMatch['home_team_id']);
				if( $aEachMatch['home_score'] > $aEachMatch['away_score'] )
					array_push($aPoint, 3);
				else if( $aEachMatch['home_score'] == $aEachMatch['away_score'] )
					array_push($aPoint, 1);
				else
					array_push($aPoint, 0);
				
				array_push($aGd, $aEachMatch['home_score'] - $aEachMatch['away_score']);
				array_push($aGf, $aEachMatch['home_score']);
				
				$aNewTable = array();
				$aNewTable['P'] = 1;
				$aNewTable['GF'] = $aEachMatch['home_score'];
				$aNewTable['GA'] = $aEachMatch['away_score'];
				$aNewTable['club_id'] = $aEachMatch['home_team_id'];
				$aNewTable['club_name'] = $aEachMatch['home_team_name'];
				
				$aNewTable['W'] = 0;
				$aNewTable['D'] = 0;
				$aNewTable['L'] = 0;
				if( $aEachMatch['home_score'] > $aEachMatch['away_score'] )
					$aNewTable['W'] = 1;
				else if( $aEachMatch['home_score'] == $aEachMatch['away_score'] )
					$aNewTable['D'] = 1;
				else
					$aNewTable['L'] = 1;
				
				array_push($aTable, $aNewTable);
			}
			
			if( $iIndexAway !== false ) {
			
				if( $aEachMatch['away_score'] > $aEachMatch['home_score'] )
					$aPoint[$iIndexAway] += 3;
				else if( $aEachMatch['away_score'] == $aEachMatch['home_score'] )
					$aPoint[$iIndexAway] += 1;
			
				$aGd[$iIndexAway] += ( $aEachMatch['away_score'] - $aEachMatch['home_score'] );
				$aGf[$iIndexAway] += $aEachMatch['away_score'];
			
				$aTable[$iIndexAway]['P']++;
				$aTable[$iIndexAway]['GF'] += $aEachMatch['away_score'];
				$aTable[$iIndexAway]['GA'] += $aEachMatch['home_score'];
			
				if( $aEachMatch['away_score'] > $aEachMatch['home_score'] )
					$aTable[$iIndexAway]['W']++;
				else if( $aEachMatch['away_score'] == $aEachMatch['home_score'] )
					$aTable[$iIndexAway]['D']++;
				else
					$aTable[$iIndexAway]['L']++;
			}
			else {
				array_push($aClubId, $aEachMatch['away_team_id']);
				array_push($aClubIdUnsort, $aEachMatch['away_team_id']);
				if( $aEachMatch['away_score'] > $aEachMatch['home_score'] )
					array_push($aPoint, 3);
				else if( $aEachMatch['away_score'] == $aEachMatch['home_score'] )
					array_push($aPoint, 1);
				else
					array_push($aPoint, 0);
			
				array_push($aGd, $aEachMatch['away_score'] - $aEachMatch['home_score']);
				array_push($aGf, $aEachMatch['away_score']);
			
				$aNewTable = array();
				$aNewTable['P'] = 1;
				$aNewTable['GF'] = $aEachMatch['away_score'];
				$aNewTable['GA'] = $aEachMatch['home_score'];
				$aNewTable['club_id'] = $aEachMatch['away_team_id'];
				$aNewTable['club_name'] = $aEachMatch['away_team_name'];
			
				$aNewTable['W'] = 0;
				$aNewTable['D'] = 0;
				$aNewTable['L'] = 0;
				if( $aEachMatch['away_score'] > $aEachMatch['home_score'] )
					$aNewTable['W'] = 1;
				else if( $aEachMatch['away_score'] == $aEachMatch['home_score'] )
					$aNewTable['D'] = 1;
				else
					$aNewTable['L'] = 1;
			
				array_push($aTable, $aNewTable);
			}
			
			$i++;
		}
		
		array_multisort($aPoint, SORT_DESC, SORT_NUMERIC, 
				$aGd, SORT_DESC, SORT_NUMERIC,
				$aGf, SORT_DESC, SORT_NUMERIC,
				$aClubId, SORT_DESC, SORT_NUMERIC);
		
		$aCalculatedTable = array();
		foreach( $aClubId as $iClubId ) {
			array_push($aCalculatedTable, $aTable[array_search($iClubId, $aClubIdUnsort)]);
		}
		
		for( $i = 0; $i < count($aCalculatedTable); $i++ ) {
			$aCalculatedTable[$i]['GD'] = $aCalculatedTable[$i]['GF'] - $aCalculatedTable[$i]['GA'];
			$aCalculatedTable[$i]['point'] = 3 * $aCalculatedTable[$i]['W'] + $aCalculatedTable[$i]['D'];
		}
		
		/* Get Saved Score Table */
		$sSqlStatement = "SELECT club_id, played, win, draw, lose, goal_for, goal_against,
					goal_difference, point, name_th AS club_name
			FROM `score_table` S JOIN `club` C ON S.club_id = C.id
			WHERE S.status = 1 AND S.deleted = 0 AND tournament_id = 1 AND season_id = $iCurrentSeason
			ORDER BY place ASC";
		$aSavedTable = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
	
		$this->renderPartial('quick_score_table', array(
				'aCalculatedTable' => $aCalculatedTable,
				'aSavedTable' => $aSavedTable,
		));
	}
	
	public function actionSaveScoreTable() {
		
		/* Check Authentication */
		if( !$this->checkAuthentication() ) {
			echo 0;
			return;
		}
		
		/* Inputs */
		$sInput = $_POST['input'];
		$sCurrentTime = Helpers::getCurrentTime();
		$iCurrentUser = Helpers::getUserId( $_COOKIE['ppfantasy_username'] );
		$iCurrentSeason = Helpers::getConfigValue('latest_season');
		
		/* Delete the old ones */
		$sSqlStatement = "DELETE FROM `score_table`
				WHERE tournament_id = 1 AND season_id = $iCurrentSeason";
		Yii::app()->db->createCommand($sSqlStatement)->execute();
		
		/* Add the new ones */
		$aInput = explode("|", $sInput);
		foreach( $aInput as $aEachInput ) {
			$aEachValue = explode(",", $aEachInput);
			$model = new ScoreTable();
			$model->place = $aEachValue[0];
			$model->club_id = $aEachValue[1];
			$model->played = $aEachValue[2];
			$model->win = $aEachValue[3];
			$model->draw = $aEachValue[4];
			$model->lose = $aEachValue[5];
			$model->goal_for = $aEachValue[6];
			$model->goal_against = $aEachValue[7];
			$model->goal_difference = $aEachValue[8];
			$model->point = $aEachValue[9];
			$model->season_id = $iCurrentSeason;
			$model->tournament_id = 1;
			$model->created_date = $sCurrentTime;
			$model->created_by = $iCurrentUser;
			$model->save();
		}
		
		echo 1;
	}
	
	public function actionUpdateUserTotalPoint() {
		
		/* Check Authentication */
		if( !$this->checkAuthentication() ) {
			echo 0;
			return;
		}
		
		$sCurrentTime = Helpers::getCurrentTime();
		$iCurrentUser = Helpers::getUserId( $_COOKIE['ppfantasy_username'] );
		
		/* Get User's Point From USER_MY_XI */
		$sSqlStatement = "SELECT SUM(point) AS total_point, user_id
			FROM `user_my_xi`
			WHERE status = 1 AND deleted = 0 AND in_11 = 1
			GROUP BY user_id
			ORDER BY SUM(point) DESC";
		$aUserPoint = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		/* Get User's Point From USER_MY_XI (Latest Week) */
		$iLatestWeekId = Helpers::getConfigValue('latest_week');
		$sSqlStatement = "SELECT SUM(point) AS total_point, user_id
			FROM `user_my_xi`
			WHERE status = 1 AND deleted = 0 AND in_11 = 1 AND week_id = $iLatestWeekId
			GROUP BY user_id";
		$aUserPointLatestWeek = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		/* Update Point to USER_TOTAL_POINT */
		foreach( $aUserPoint as $aEachUser ) {
			$oUser = User::model()->findByPk($aEachUser['user_id']);
			UserTotalPoint::model()->updateByPk( $aEachUser['user_id'], array(
					'total_point' => $aEachUser['total_point'] - $oUser->minus_point,
			) );
		}
		
		/* Update Point to USER_TOTAL_POINT (Latest Week) */
		foreach( $aUserPointLatestWeek as $aEachUser ) {
			
			$iUserId = $aEachUser['user_id'];
			$sSqlStatement = "SELECT minus_point
				FROM `user_minus_point`
				WHERE status = 1 AND deleted = 0 AND user_id = $iUserId AND week_id = $iLatestWeekId";
			$aMinusLatestWeek = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
			
			$iMinus = count($aMinusLatestWeek) == 0 ? 0 : $aMinusLatestWeek[0]['minus_point'];
			
			UserTotalPoint::model()->updateByPk( $aEachUser['user_id'], array(
					'last_week_point' => $aEachUser['total_point'] - $iMinus,
			) );
		}
		
		/* Ranking */
		$sSqlStatement = "SELECT user_id
			FROM `user_total_point`
			WHERE status = 1 AND deleted = 0
			ORDER BY total_point DESC";
		$aUserPoint = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		$iPlace = 1;
		foreach( $aUserPoint as $aEachUser) {
			UserTotalPoint::model()->updateByPk( $aEachUser['user_id'], array(
					'place' => $iPlace,
					'modified_date' => $sCurrentTime,
					'modified_by' => $iCurrentUser,
			) );
			$iPlace++;
		}
		
		echo 1;
	}
	
	public function actionUpdateUserGroupMember() {
		
		/* Check Authentication */
		if( !$this->checkAuthentication() ) {
			echo 0;
			return;
		}
		
		$sCurrentTime = Helpers::getCurrentTime();
		$iCurrentUser = Helpers::getUserId( $_COOKIE['ppfantasy_username'] );
		
		$sSqlStatement = "SELECT M.id AS ugm_id, M.user_id AS user_id, G.start_week_id AS start_week_id
			FROM `user_group_member` M JOIN `user_group` G ON M.user_group_id = G.id
			WHERE M.status = 1 AND M.deleted = 0";
		
		$aUserGroupMember = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		foreach( $aUserGroupMember as $aEachMember) {
			
			/* Get all weeks */
			
			// Get season and tournament
			$oWeek = Week::model()->findByPk($aEachMember['start_week_id']);
			$iSeasonId = $oWeek->season_id;
			$iTournamentId = $oWeek->tournament_id;
			$iFixtureNo = $oWeek->fixture_no;
			
			// Get weeks
			$sSqlStatement = "SELECT id
				FROM `week`
				WHERE status = 1 AND deleted = 0 AND season_id = $iSeasonId AND tournament_id = $iTournamentId 
					AND fixture_no >= $iFixtureNo";
			$aAllWeeks = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
			
			$sAllWeeks = "";
			foreach( $aAllWeeks as $aEachWeek ) {
				if( $sAllWeeks == "")
					$sAllWeeks = $aEachWeek['id'];
				else
					$sAllWeeks = $sAllWeeks . ',' . $aEachWeek['id'];
			}
			
			/* Sum the points */
			$iUserId = $aEachMember['user_id'];
			$sSqlStatement = "SELECT SUM(point) AS total_point
				FROM `user_my_xi`
				WHERE status = 1 AND deleted = 0 AND in_11 = 1 AND user_id = $iUserId AND week_id IN ($sAllWeeks)
				GROUP BY user_id";
			$iTotalPoint = Yii::app()->db->createCommand($sSqlStatement)->queryAll()[0]['total_point'];
			
			$sSqlStatement = "SELECT SUM(minus_point) AS minus
				FROM `user_minus_point`
				WHERE status = 1 AND deleted = 0 AND user_id = $iUserId AND week_id IN ($sAllWeeks)
				GROUP BY user_id";
			$aMinus = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
			$iMinus = count($aMinus) == 0 ? 0 : $aMinus[0]['minus'];
			
			$iTotalPoint = $iTotalPoint - $iMinus;
			
			/* Sum the points (latest week) */
			$iLatestWeekId = Helpers::getConfigValue('latest_week');
			$sSqlStatement = "SELECT SUM(point) AS total_point
				FROM `user_my_xi`
				WHERE status = 1 AND deleted = 0 AND in_11 = 1 AND user_id = $iUserId AND week_id = $iLatestWeekId
				GROUP BY user_id";
			$iTotalPointLatestWeek = Yii::app()->db->createCommand($sSqlStatement)->queryAll()[0]['total_point'];
			
			$sSqlStatement = "SELECT SUM(minus_point) AS minus
				FROM `user_minus_point`
				WHERE status = 1 AND deleted = 0 AND user_id = $iUserId AND week_id = $iLatestWeekId
				GROUP BY user_id";
			$aMinus = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
			$iMinus = count($aMinus) == 0 ? 0 : $aMinus[0]['minus'];
			
			$iTotalPointLatestWeek = $iTotalPointLatestWeek - $iMinus;
			
			/* Update */
			UserGroupMember::model()->updateByPk( $aEachMember['ugm_id'], array(
					'total_point' => $iTotalPoint,
					'latest_week_point' => $iTotalPointLatestWeek,
					'modified_date' => $sCurrentTime,
					'modified_by' => $iCurrentUser,
			) );
		}
		
		$sSqlStatement = "SELECT id, user_group_id
			FROM `user_group_member`
			WHERE status = 1 AND deleted = 0
			ORDER BY user_group_id ASC, total_point DESC";
		
		$aUserGroupMember = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		
		$iGroupId = 0;
		$iPosition = 1;
		foreach( $aUserGroupMember as $aEachMember ) {
			
			if( $iGroupId == 0)
				$iGroupId = $aEachMember['user_group_id'];
			
			if( $iGroupId != $aEachMember['user_group_id']) {
				$iGroupId = $aEachMember['user_group_id'];
				$iPosition = 1;
			}
			
			UserGroupMember::model()->updateByPk( $aEachMember['id'], array(
					'place' => $iPosition,
					'modified_date' => $sCurrentTime,
					'modified_by' => $iCurrentUser,
			) );
			
			$iPosition++;
		}
		
		echo 1;
	}
	
}
