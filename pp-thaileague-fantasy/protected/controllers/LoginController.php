<?php

class LoginController extends Controller
{
	public function actionIndex() {
		echo 'cannot access';
	}
	
	public function actionLogin() {
	
		$sSqlStatement = "SELECT id
				FROM `user`
				WHERE status = 1 AND deleted = 0 AND
					(email = :username OR username = :username) AND password = :password";
	
		$aResult = Yii::app()->db->createCommand($sSqlStatement)
			->bindValues([
					':username' => $_POST['username'],
					':password' => sha1($_POST['password']),
			])
			->queryAll();
	
		if( count($aResult) > 0 ) {
			$cookieTime = $_POST['alwayslogin'] == 1 ? ( time() + (86400 * 30) ) : ( time() + 3600 );
			setcookie('ppfantasy_username', $_POST['username'], $cookieTime, "/");
			setcookie('ppfantasy_password', sha1($_POST['password']), $cookieTime, "/");
			echo 1;
		}
		else
			echo 0;
	}
	
	public function actionRegister() {
		
		/* Check 1000 users */
		$sSqlStatement = "SELECT id FROM `user` WHERE status = 1 AND deleted = 0";
		$aResult = Yii::app()->db->createCommand($sSqlStatement)->queryAll();
		if( count($aResult) >= 1000 ) {
			echo 'full_user';
			return;
		}
		
		$bSetEmail = isset($_POST['email']) && $_POST['email'] != "";
		$bSetUsername = isset($_POST['username']) && $_POST['username'] != "";
		$bSetPassword = isset($_POST['password']) && $_POST['password'] != "";
		$bSetPasswordRepeat = isset($_POST['password_repeat']) && $_POST['password_repeat'] != "";
		
		if( !($bSetEmail && $bSetUsername && $bSetPassword && $bSetPasswordRepeat) ) {
			echo 'still_blank';
			return;
		}
		
		if( !filter_var($_POST['email'], FILTER_VALIDATE_EMAIL) ) {
			echo 'wrong_email';
			return;
		}
		
		if( strlen($_POST['username']) < 6 ) {
			echo 'short_username';
			return;
		}
		
		if( strlen($_POST['password']) < 6 ) {
			echo 'short_password';
			return;
		}
		
		if( $_POST['password'] != $_POST['password_repeat'] ) {
			echo 'wrong_password_repeat';
			return;
		}
		
		$sSqlStatement = "SELECT id FROM `user` WHERE status = 1 AND deleted = 0 AND (email = :email OR username = :email)";
		$aResult = Yii::app()->db->createCommand($sSqlStatement)
			->bindValues([
					':email' => $_POST['email'],
			])
			->queryAll();
		if( count($aResult) > 0 ) {
			echo 'exist_email';
			return;
		}
		
		$sSqlStatement = "SELECT id FROM `user` WHERE status = 1 AND deleted = 0 AND username = :username";
		$aResult = Yii::app()->db->createCommand($sSqlStatement)
			->bindValues([
					':username' => $_POST['username'],
			])
			->queryAll();
		if( count($aResult) > 0 ) {
			echo 'exist_username';
			return;
		}
		
		$model = new User();
		$model->email = $_POST['email'];
		$model->username = $_POST['username'];
		$model->password = sha1($_POST['password']);
		$model->created_date = Helpers::getCurrentTime();
		
		if( !$model->save() ) {
			echo 'save_failed';
			return;
		}
		
		$sSqlStatement = "SELECT COUNT(user_id) AS total_user FROM `user_total_point` WHERE status = 1 AND deleted = 0";
		$iTotalUser = Yii::app()->db->createCommand($sSqlStatement)->queryAll()[0]['total_user'];
		$model_user_point = new UserTotalPoint();
		$model_user_point->user_id = $model->id;
		$model_user_point->place = $iTotalUser + 1;
		$model_user_point->created_date = Helpers::getCurrentTime();
		$model_user_point->save();
		
		$model_user_move_quota = new UserMoveQuota();
		$model_user_move_quota->user_id = $model->id;
		$model_user_move_quota->week_move_left = 15;
		$model_user_move_quota->reset_move_left = 2;
		$model_user_move_quota->created_date = Helpers::getCurrentTime();
		$model_user_move_quota->save();
		
		echo 'success';
	}
	
	public function actionLogout() {
	
		setcookie('ppfantasy_username', "", time() - 3600, "/");
		setcookie('ppfantasy_password', "", time() - 3600, "/");
		echo 1;
	}

}
