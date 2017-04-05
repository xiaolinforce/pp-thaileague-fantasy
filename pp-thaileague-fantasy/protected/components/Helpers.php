<?php
class Helpers {
	
	public static function getThumbnailSrc($sImgPath, $iDesiredWidth) {
		
		/* Variables */
		$sCacheDir = "images/cache/";
		$sFileExtension = pathinfo ( $sImgPath, PATHINFO_EXTENSION );
		$sCacheName = hash ( "md5", $sImgPath . $iDesiredWidth );
		$sImgPath = iconv ( "utf-8", "tis-620", $sImgPath );
		
		/* Check if cache has already been created */
		if (file_exists ( $sCacheDir . $sCacheName . "." . $sFileExtension ))
			return $sCacheDir . $sCacheName . "." . $sFileExtension;
			
		/* Check if sImgPath is not existed */
		if (! file_exists ( $sImgPath ))
			return null;
			
		/* Check if it is a GIF (return the original because this function cannot be used with GIF) */
		if (strtolower ( $sFileExtension ) == "gif")
			return $sImgPath;
			
		/* Check if it is not a picture */
		if (strtolower ( $sFileExtension ) != "jpg" && strtolower ( $sFileExtension ) != "png")
			return null;
			
		/* Create dir if cache folder is not existed */
		if (! file_exists ( $sCacheDir ))
			mkdir ( $sCacheDir );
			
		/* Create cache */
		if (strtolower ( $sFileExtension ) == "jpg")
			$source_image = imagecreatefromjpeg ( $sImgPath );
		else
			$source_image = imagecreatefrompng ( $sImgPath );
		
		$iImgwidth = imagesx ( $source_image );
		$iImgheight = imagesy ( $source_image );
		$iDesiredHeight = floor ( $iImgheight * ($iDesiredWidth / $iImgwidth) );
		$virtual_image = imagecreatetruecolor ( $iDesiredWidth, $iDesiredHeight );
		imagealphablending ( $virtual_image, false );
		imagesavealpha ( $virtual_image, true );
		$trans_layer_overlay = imagecolorallocatealpha ( $virtual_image, 220, 220, 220, 127 );
		imagefill ( $virtual_image, 0, 0, $trans_layer_overlay );
		imagecopyresampled ( $virtual_image, $source_image, 0, 0, 0, 0, $iDesiredWidth, $iDesiredHeight, $iImgwidth, $iImgheight );
		
		if (strtolower ( $sFileExtension ) == "jpg")
			imagejpeg ( $virtual_image, $sCacheDir . $sCacheName . "." . $sFileExtension );
		else
			imagepng ( $virtual_image, $sCacheDir . $sCacheName . "." . $sFileExtension );
		
		return $sCacheDir . $sCacheName . "." . $sFileExtension;
	}
	
	public static function getUserId($sUsername) {
		
		$sSqlStatement = "SELECT id
				FROM `user`
				WHERE status = 1 AND deleted = 0 AND (username = :username OR email = :username)";
		
		$aResult = Yii::app()->db->createCommand($sSqlStatement)
			->bindValues([
					':username' => $sUsername,
			])
			->queryAll();
			
		return count($aResult) == 0 ? 0 : $aResult[0]['id'];
	}
	
	public static function checkAuthentication($sUsername, $sPassword) {
		$sSqlStatement = "SELECT id
				FROM `user`
				WHERE status = 1 AND deleted = 0 AND
					(email = :username OR username = :username) AND password = :password";
		
		$aResult = Yii::app()->db->createCommand($sSqlStatement)
			->bindValues([
					':username' => $sUsername,
					':password' => $sPassword,
			])
			->queryAll();
		
		if( count($aResult) == 0 )
			return false;
		else
			return true;
	}
	
	public function checkAuthenticationAdmin($sUsername, $sPassword) {
		$sSqlStatement = "SELECT id
				FROM `user`
				WHERE status = 1 AND deleted = 0 AND role_id <> 1 AND
					(email = :username OR username = :username) AND password = :password";
		
		$aResult = Yii::app()->db->createCommand($sSqlStatement)
			->bindValues([
					':username' => $sUsername,
					':password' => $sPassword,
			])
			->queryAll();
		
		if( count($aResult) == 0 )
			return false;
		else
			return true;
	}
	
	public static function getConfigValue($sKey) {
		$sSqlStatement = "SELECT config_value FROM `configs` WHERE status = 1 AND deleted = 0 AND config_key = '$sKey'";
		return Yii::app()->db->createCommand($sSqlStatement)->queryAll()[0]['config_value'];
	}
	
	public static function getCurrentTime() {
		$iMinDiff = Helpers::getConfigValue('diff_server_time');
		$iSecondDiff = $iMinDiff * 60;
		$iThaiTimeStamp = time() + $iSecondDiff;
		return date('Y-m-d H:i:s', $iThaiTimeStamp);
	}
	
}