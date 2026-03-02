from flask_wtf import FlaskForm
from wtforms import HiddenField,SelectField,StringField,PasswordField,IntegerField,SubmitField,DecimalField,TextAreaField,validators,BooleanField,RadioField,FieldList
from wtforms.validators import Optional,InputRequired, EqualTo, NumberRange,optional,DataRequired

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
    invites = FieldList(StringField(), "Users to invite (optional)", min_entries=3)
    invite_message = StringField("Invite message (optional)")
    submit = SubmitField("Create")

class EnterCodeForm(FlaskForm):
    code = StringField('Game Code: ', validators=[InputRequired()])
    submit = SubmitField("Join")

class accountForm(FlaskForm):
    user_id = StringField('Change Name: ', [InputRequired(),validators.Length(min=5,max=15)])
    old_password=PasswordField('Old Password: ', validators = 
    [Optional(),validators.Length(min=5,max=25)])
    new_password=PasswordField('New Password: ', validators = 
    [Optional(),validators.Length(min=5,max=25)])
    submit = SubmitField('Save')
    cancel = SubmitField('Cancel')
    
    
class pictureForm(FlaskForm):
    selected_picture=HiddenField()
    submitTwo = SubmitField('Save')
    cancelTwo = SubmitField('Cancel')

class uploadForm(FlaskForm):
    upload=SubmitField('Upload')