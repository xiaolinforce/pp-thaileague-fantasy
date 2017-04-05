<?php

/**
 * This is the model class for table "player".
 *
 * The followings are the available columns in table 'player':
 * @property string $id
 * @property string $name_th
 * @property string $surname_th
 * @property string $name_en
 * @property string $surname_en
 * @property string $called_name_th
 * @property string $called_name_en
 * @property string $called_name_th_full
 * @property string $called_name_en_full
 * @property string $birthdate
 * @property string $image
 * @property string $current_shirt_no
 * @property string $player_position_id
 * @property string $current_club_id
 * @property string $nation_id
 * @property string $description
 * @property string $status
 * @property string $deleted
 * @property string $created_date
 * @property string $created_by
 * @property string $modified_date
 * @property integer $modified_by
 */
class Player extends CActiveRecord
{
	/**
	 * @return string the associated database table name
	 */
	public function tableName()
	{
		return 'player';
	}

	/**
	 * @return array validation rules for model attributes.
	 */
	public function rules()
	{
		// NOTE: you should only define rules for those attributes that
		// will receive user inputs.
		return array(
			array('name_th, surname_th, called_name_th, player_position_id, current_club_id, created_date', 'required'),
			array('modified_by', 'numerical', 'integerOnly'=>true),
			array('name_th, surname_th, name_en, surname_en, called_name_th_full, called_name_en_full', 'length', 'max'=>100),
			array('called_name_th, called_name_en', 'length', 'max'=>50),
			array('image', 'length', 'max'=>300),
			array('current_shirt_no', 'length', 'max'=>2),
			array('player_position_id, current_club_id, nation_id, created_by', 'length', 'max'=>10),
			array('status, deleted', 'length', 'max'=>1),
			array('birthdate, description, modified_date', 'safe'),
			// The following rule is used by search().
			// @todo Please remove those attributes that should not be searched.
			array('id, name_th, surname_th, name_en, surname_en, called_name_th, called_name_en, called_name_th_full, called_name_en_full, birthdate, image, current_shirt_no, player_position_id, current_club_id, nation_id, description, status, deleted, created_date, created_by, modified_date, modified_by', 'safe', 'on'=>'search'),
		);
	}

	/**
	 * @return array relational rules.
	 */
	public function relations()
	{
		// NOTE: you may need to adjust the relation name and the related
		// class name for the relations automatically generated below.
		return array(
		);
	}

	/**
	 * @return array customized attribute labels (name=>label)
	 */
	public function attributeLabels()
	{
		return array(
			'id' => 'ID',
			'name_th' => 'Name Th',
			'surname_th' => 'Surname Th',
			'name_en' => 'Name En',
			'surname_en' => 'Surname En',
			'called_name_th' => 'Called Name Th',
			'called_name_en' => 'Called Name En',
			'called_name_th_full' => 'Called Name Th Full',
			'called_name_en_full' => 'Called Name En Full',
			'birthdate' => 'Birthdate',
			'image' => 'Image',
			'current_shirt_no' => 'Current Shirt No',
			'player_position_id' => 'Player Position',
			'current_club_id' => 'Current Club',
			'nation_id' => 'Nation',
			'description' => 'Description',
			'status' => 'Status',
			'deleted' => 'Deleted',
			'created_date' => 'Created Date',
			'created_by' => 'Created By',
			'modified_date' => 'Modified Date',
			'modified_by' => 'Modified By',
		);
	}

	/**
	 * Retrieves a list of models based on the current search/filter conditions.
	 *
	 * Typical usecase:
	 * - Initialize the model fields with values from filter form.
	 * - Execute this method to get CActiveDataProvider instance which will filter
	 * models according to data in model fields.
	 * - Pass data provider to CGridView, CListView or any similar widget.
	 *
	 * @return CActiveDataProvider the data provider that can return the models
	 * based on the search/filter conditions.
	 */
	public function search()
	{
		// @todo Please modify the following code to remove attributes that should not be searched.

		$criteria=new CDbCriteria;

		$criteria->compare('id',$this->id,true);
		$criteria->compare('name_th',$this->name_th,true);
		$criteria->compare('surname_th',$this->surname_th,true);
		$criteria->compare('name_en',$this->name_en,true);
		$criteria->compare('surname_en',$this->surname_en,true);
		$criteria->compare('called_name_th',$this->called_name_th,true);
		$criteria->compare('called_name_en',$this->called_name_en,true);
		$criteria->compare('called_name_th_full',$this->called_name_th_full,true);
		$criteria->compare('called_name_en_full',$this->called_name_en_full,true);
		$criteria->compare('birthdate',$this->birthdate,true);
		$criteria->compare('image',$this->image,true);
		$criteria->compare('current_shirt_no',$this->current_shirt_no,true);
		$criteria->compare('player_position_id',$this->player_position_id,true);
		$criteria->compare('current_club_id',$this->current_club_id,true);
		$criteria->compare('nation_id',$this->nation_id,true);
		$criteria->compare('description',$this->description,true);
		$criteria->compare('status',$this->status,true);
		$criteria->compare('deleted',$this->deleted,true);
		$criteria->compare('created_date',$this->created_date,true);
		$criteria->compare('created_by',$this->created_by,true);
		$criteria->compare('modified_date',$this->modified_date,true);
		$criteria->compare('modified_by',$this->modified_by);

		return new CActiveDataProvider($this, array(
			'criteria'=>$criteria,
		));
	}

	/**
	 * Returns the static model of the specified AR class.
	 * Please note that you should have this exact method in all your CActiveRecord descendants!
	 * @param string $className active record class name.
	 * @return Player the static model class
	 */
	public static function model($className=__CLASS__)
	{
		return parent::model($className);
	}
}
