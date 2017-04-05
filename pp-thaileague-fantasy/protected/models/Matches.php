<?php

/**
 * This is the model class for table "matches".
 *
 * The followings are the available columns in table 'matches':
 * @property string $id
 * @property string $home_team_id
 * @property string $away_team_id
 * @property string $home_score
 * @property string $away_score
 * @property string $home_score_ex
 * @property string $away_score_ex
 * @property string $home_score_pen
 * @property string $away_score_pen
 * @property string $kickoff_time
 * @property string $stadium_id
 * @property string $week_id
 * @property string $home_coach_id
 * @property string $away_coach_id
 * @property string $added_min_first_half
 * @property string $added_min_second_half
 * @property string $added_min_first_ex
 * @property string $added_min_second_ex
 * @property string $approved
 * @property string $man_of_the_match
 * @property string $attendance
 * @property string $description
 * @property string $status
 * @property string $deleted
 * @property string $created_date
 * @property string $created_by
 * @property string $modified_date
 * @property integer $modified_by
 */
class Matches extends CActiveRecord
{
	/**
	 * @return string the associated database table name
	 */
	public function tableName()
	{
		return 'matches';
	}

	/**
	 * @return array validation rules for model attributes.
	 */
	public function rules()
	{
		// NOTE: you should only define rules for those attributes that
		// will receive user inputs.
		return array(
			array('home_team_id, away_team_id, week_id, created_date', 'required'),
			array('modified_by', 'numerical', 'integerOnly'=>true),
			array('home_team_id, away_team_id, stadium_id, week_id, home_coach_id, away_coach_id, man_of_the_match, attendance, created_by', 'length', 'max'=>10),
			array('home_score, away_score, home_score_ex, away_score_ex, home_score_pen, away_score_pen', 'length', 'max'=>3),
			array('added_min_first_half, added_min_second_half, added_min_first_ex, added_min_second_ex', 'length', 'max'=>2),
			array('approved, status, deleted', 'length', 'max'=>1),
			array('kickoff_time, description, modified_date', 'safe'),
			// The following rule is used by search().
			// @todo Please remove those attributes that should not be searched.
			array('id, home_team_id, away_team_id, home_score, away_score, home_score_ex, away_score_ex, home_score_pen, away_score_pen, kickoff_time, stadium_id, week_id, home_coach_id, away_coach_id, added_min_first_half, added_min_second_half, added_min_first_ex, added_min_second_ex, approved, man_of_the_match, attendance, description, status, deleted, created_date, created_by, modified_date, modified_by', 'safe', 'on'=>'search'),
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
			'home_team_id' => 'Home Team',
			'away_team_id' => 'Away Team',
			'home_score' => 'Home Score',
			'away_score' => 'Away Score',
			'home_score_ex' => 'Home Score Ex',
			'away_score_ex' => 'Away Score Ex',
			'home_score_pen' => 'Home Score Pen',
			'away_score_pen' => 'Away Score Pen',
			'kickoff_time' => 'Kickoff Time',
			'stadium_id' => 'Stadium',
			'week_id' => 'Week',
			'home_coach_id' => 'Home Coach',
			'away_coach_id' => 'Away Coach',
			'added_min_first_half' => 'Added Min First Half',
			'added_min_second_half' => 'Added Min Second Half',
			'added_min_first_ex' => 'Added Min First Ex',
			'added_min_second_ex' => 'Added Min Second Ex',
			'approved' => 'Approved',
			'man_of_the_match' => 'Man Of The Match',
			'attendance' => 'Attendance',
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
		$criteria->compare('home_team_id',$this->home_team_id,true);
		$criteria->compare('away_team_id',$this->away_team_id,true);
		$criteria->compare('home_score',$this->home_score,true);
		$criteria->compare('away_score',$this->away_score,true);
		$criteria->compare('home_score_ex',$this->home_score_ex,true);
		$criteria->compare('away_score_ex',$this->away_score_ex,true);
		$criteria->compare('home_score_pen',$this->home_score_pen,true);
		$criteria->compare('away_score_pen',$this->away_score_pen,true);
		$criteria->compare('kickoff_time',$this->kickoff_time,true);
		$criteria->compare('stadium_id',$this->stadium_id,true);
		$criteria->compare('week_id',$this->week_id,true);
		$criteria->compare('home_coach_id',$this->home_coach_id,true);
		$criteria->compare('away_coach_id',$this->away_coach_id,true);
		$criteria->compare('added_min_first_half',$this->added_min_first_half,true);
		$criteria->compare('added_min_second_half',$this->added_min_second_half,true);
		$criteria->compare('added_min_first_ex',$this->added_min_first_ex,true);
		$criteria->compare('added_min_second_ex',$this->added_min_second_ex,true);
		$criteria->compare('approved',$this->approved,true);
		$criteria->compare('man_of_the_match',$this->man_of_the_match,true);
		$criteria->compare('attendance',$this->attendance,true);
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
	 * @return Matches the static model class
	 */
	public static function model($className=__CLASS__)
	{
		return parent::model($className);
	}
}
