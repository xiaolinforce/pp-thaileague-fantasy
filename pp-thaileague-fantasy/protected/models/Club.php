<?php

/**
 * This is the model class for table "club".
 *
 * The followings are the available columns in table 'club':
 * @property string $id
 * @property string $name_th
 * @property string $name_en
 * @property string $short_name_th
 * @property string $short_name_en
 * @property string $current_coach_id
 * @property string $main_stadium_id
 * @property string $image_full
 * @property string $image_rectangle
 * @property string $color_dark
 * @property string $color_light
 * @property string $description
 * @property string $status
 * @property string $deleted
 * @property string $created_date
 * @property string $created_by
 * @property string $modified_date
 * @property integer $modified_by
 */
class Club extends CActiveRecord
{
	/**
	 * @return string the associated database table name
	 */
	public function tableName()
	{
		return 'club';
	}

	/**
	 * @return array validation rules for model attributes.
	 */
	public function rules()
	{
		// NOTE: you should only define rules for those attributes that
		// will receive user inputs.
		return array(
			array('name_th, short_name_th, created_date', 'required'),
			array('modified_by', 'numerical', 'integerOnly'=>true),
			array('name_th, name_en', 'length', 'max'=>100),
			array('short_name_th, short_name_en', 'length', 'max'=>50),
			array('current_coach_id, main_stadium_id, color_dark, color_light, created_by', 'length', 'max'=>10),
			array('image_full, image_rectangle', 'length', 'max'=>300),
			array('status, deleted', 'length', 'max'=>1),
			array('description, modified_date', 'safe'),
			// The following rule is used by search().
			// @todo Please remove those attributes that should not be searched.
			array('id, name_th, name_en, short_name_th, short_name_en, current_coach_id, main_stadium_id, image_full, image_rectangle, color_dark, color_light, description, status, deleted, created_date, created_by, modified_date, modified_by', 'safe', 'on'=>'search'),
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
			'name_en' => 'Name En',
			'short_name_th' => 'Short Name Th',
			'short_name_en' => 'Short Name En',
			'current_coach_id' => 'Current Coach',
			'main_stadium_id' => 'Main Stadium',
			'image_full' => 'Image Full',
			'image_rectangle' => 'Image Rectangle',
			'color_dark' => 'Color Dark',
			'color_light' => 'Color Light',
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
		$criteria->compare('name_en',$this->name_en,true);
		$criteria->compare('short_name_th',$this->short_name_th,true);
		$criteria->compare('short_name_en',$this->short_name_en,true);
		$criteria->compare('current_coach_id',$this->current_coach_id,true);
		$criteria->compare('main_stadium_id',$this->main_stadium_id,true);
		$criteria->compare('image_full',$this->image_full,true);
		$criteria->compare('image_rectangle',$this->image_rectangle,true);
		$criteria->compare('color_dark',$this->color_dark,true);
		$criteria->compare('color_light',$this->color_light,true);
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
	 * @return Club the static model class
	 */
	public static function model($className=__CLASS__)
	{
		return parent::model($className);
	}
}
