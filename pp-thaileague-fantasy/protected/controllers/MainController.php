<?php

class MainController extends Controller
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
			
			if( count($aResult) == 0 )
				$this->actionLoginScreen();
			else if( $aResult[0]['password'] != $_COOKIE['ppfantasy_password'] )
				$this->actionLoginScreen();
			else
				$this->actionIndex();
		}
		else
			$this->actionLoginScreen();
	}
	
	public function actionIndex() {
		
		$this->renderPartial('main');
	}
	
	public function actionLoginScreen() {
	
		$this->renderPartial('login');
	}

}
