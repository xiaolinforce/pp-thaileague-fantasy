<?php

/**
 * This is the model class for table "match_player".
 *
 * The followings are the available columns in table 'match_player':
 * @property string $id
 * @property string $match_id
 * @property string $player_id
 * @property string $club_id
 * @property string $start_11
 * @property string $captain
 * @property string $shirt_no
 * @property string $description
 * @property string $status
 * @property string $deleted
 * @property string $created_date
 * @property string $created_by
 * @property string $modified_date
 * @property integer $modified_by
 */
class MatchPlayer extends CActiveRecord
{
	/**
	 * @return string the associated database table name
	 */
	public function tableName()
	{
		return 'match_player';
	}

	/**
	 * @return array validation rules for model attributes.
	 */
	public function rules()
	{
		// NOTE: you should only define rules for those attributes that
		// will receive user inputs.
		return array(
			array('match_id, player_id, club_id, created_date', 'required'),
			array('modified_by', 'numerical', 'integerOnly'=>true),
			array('match_id, player_id, club_id, created_by', 'length', 'max'=>10),
			array('start_11, captain, status, deleted', 'length', 'max'=>1),
			array('shirt_no', 'length', 'max'=>2),
			array('description, modified_date', 'safe'),
			// The following rule is used by search().
			// @todo Please remove those attributes that should not be searched.
			array('id, match_id, player_id, club_id, start_11, captain, shirt_no, description, status, deleted, created_date, created_by, modified_date, modified_by', 'safe', 'on'=>'search'),
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
			'match_id' => 'Match',
			'player_id' => 'Player',
			'club_id' => 'Club',
			'start_11' => 'Start 11',
			'captain' => 'Captain',
			'shirt_no' => 'Shirt No',
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
		$criteria->compare('match_id',$this->match_id,true);
		$criteria->compare('player_id',$this->player_id,true);
		$criteria->compare('club_id',$this->club_id,true);
		$criteria->compare('start_11',$this->start_11,true);
		$criteria->compare('captain',$this->captain,true);
		$criteria->compare('shirt_no',$this->shirt_no,true);
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
	 * @return MatchPlayer the static model class
	 */
	public static function model($className=__CLASS__)
	{
		return parent::model($className);
	}
}
