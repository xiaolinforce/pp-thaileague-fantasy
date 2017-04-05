<?php

/**
 * This is the model class for table "score_table".
 *
 * The followings are the available columns in table 'score_table':
 * @property string $id
 * @property string $place
 * @property string $club_id
 * @property string $played
 * @property string $win
 * @property string $draw
 * @property string $lose
 * @property string $goal_for
 * @property string $goal_against
 * @property integer $goal_difference
 * @property integer $point
 * @property string $season_id
 * @property string $tournament_id
 * @property string $description
 * @property string $status
 * @property string $deleted
 * @property string $created_date
 * @property string $created_by
 * @property string $modified_date
 * @property integer $modified_by
 */
class ScoreTable extends CActiveRecord
{
	/**
	 * @return string the associated database table name
	 */
	public function tableName()
	{
		return 'score_table';
	}

	/**
	 * @return array validation rules for model attributes.
	 */
	public function rules()
	{
		// NOTE: you should only define rules for those attributes that
		// will receive user inputs.
		return array(
			array('place, club_id, played, win, draw, lose, goal_for, goal_against, goal_difference, point, season_id, tournament_id, created_date', 'required'),
			array('goal_difference, point, modified_by', 'numerical', 'integerOnly'=>true),
			array('place, played, win, draw, lose, goal_for, goal_against', 'length', 'max'=>3),
			array('club_id, season_id, tournament_id, created_by', 'length', 'max'=>10),
			array('status, deleted', 'length', 'max'=>1),
			array('description, modified_date', 'safe'),
			// The following rule is used by search().
			// @todo Please remove those attributes that should not be searched.
			array('id, place, club_id, played, win, draw, lose, goal_for, goal_against, goal_difference, point, season_id, tournament_id, description, status, deleted, created_date, created_by, modified_date, modified_by', 'safe', 'on'=>'search'),
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
			'place' => 'Place',
			'club_id' => 'Club',
			'played' => 'Played',
			'win' => 'Win',
			'draw' => 'Draw',
			'lose' => 'Lose',
			'goal_for' => 'Goal For',
			'goal_against' => 'Goal Against',
			'goal_difference' => 'Goal Difference',
			'point' => 'Point',
			'season_id' => 'Season',
			'tournament_id' => 'Tournament',
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
		$criteria->compare('place',$this->place,true);
		$criteria->compare('club_id',$this->club_id,true);
		$criteria->compare('played',$this->played,true);
		$criteria->compare('win',$this->win,true);
		$criteria->compare('draw',$this->draw,true);
		$criteria->compare('lose',$this->lose,true);
		$criteria->compare('goal_for',$this->goal_for,true);
		$criteria->compare('goal_against',$this->goal_against,true);
		$criteria->compare('goal_difference',$this->goal_difference);
		$criteria->compare('point',$this->point);
		$criteria->compare('season_id',$this->season_id,true);
		$criteria->compare('tournament_id',$this->tournament_id,true);
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
	 * @return ScoreTable the static model class
	 */
	public static function model($className=__CLASS__)
	{
		return parent::model($className);
	}
}
