from flask_wtf import FlaskForm
from wtforms import SelectField,StringField,PasswordField,IntegerField,SubmitField,DecimalField,TextAreaField,validators,BooleanField,RadioField,FieldList
from wtforms.validators import InputRequired, EqualTo, NumberRange,optional,DataRequired

class RegistrationForm(FlaskForm):
    user_id = StringField('Username: ', validators=
    [InputRequired(),validators.Length(max=15)])
    password = PasswordField('Type in a password: ', validators = 
    [InputRequired(),validators.Length(min=5,max=25)])
    passwordRepeat = PasswordField('Repeat the password: ', validators = 
    [InputRequired(),EqualTo('password')])
    submit = SubmitField('Register')

class LoginForm(FlaskForm):
    user_id = StringField('Username: ', validators=
    [InputRequired(),validators.Length(max=15)])
    password = PasswordField('Type in a password: ', validators = 
    [InputRequired(),validators.Length(min=5,max=25)])
    submit = SubmitField('Log In')

class CreateGameForm(FlaskForm):
    visibility = SelectField("Visibility", choices=[(1, "Public"), (0, "Private")])
    game_mode = SelectField("Game Mode", choices=[(0, "Classic"), (1, "Modified")])
    invites = FieldList(StringField(), "Users to invite (optional)", min_entries=4)
    invite_message = StringField("Invite message (optional)")
    submit = SubmitField("Create")

class EnterCodeForm(FlaskForm):
    code = StringField('Game Code: ', validators=[InputRequired()])
    submit = SubmitField("Join")