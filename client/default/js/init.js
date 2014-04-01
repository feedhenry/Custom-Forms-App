/*
 JSON is automatically included with each app.

 Use the $fh.ready() (http://docs.feedhenry.com/wiki/Ready) function to trigger
 loading the local config and binding a click event to invoke the cloud action
 call which will return the remote config.
 */

/*
 Global variable definitions
 */
var currentSubmission = null;

function renderForms(formId) {
    /*
     This formId used below loads an example form, Street Service Form. This form is located on the mock mBaaS
     server.
     */
    //var formId = '53146bf95a133733451cd35b';
    $fh.forms.getForm({
        'formId': formId
    }, function (err, foundForm) {
        /*
         Print out the name and description of the returned form.
         */
        console.log('Form Name: ', foundForm.getName());
        console.log('Form Description: ', foundForm.getDescription());
        console.log('Form ID :', foundForm.getFormId());
        console.log('Last Updated :', foundForm.get('lastUpdated'));
        /*
         Calling the .getPageModelList() function on the foundForm variable returns an array of page models
         associated with that particular form. These are then printed out to the console.
        */
        var pageList = foundForm.getPageModelList();
        console.log('Array of pages associated with this form', pageList);
        /*
         Here an underscore.js template is used to iterate through all page fields and print out summary info to the console. For
         all fields in the pageFields array, the name, field type, and whether it is required that the field be filled out or not,
         is output to the console.
         */

        var fieldSection = document.getElementById('fieldSection');
        fieldSection.innerHTML = '';

        for (var page = 0; page < pageList.length; page++) {
            var currentPage = pageList[page];
            var pageFields = currentPage.getFieldModelList();
            for (var field = 0; field < pageFields.length; field++) {
                var currentField = pageFields[field];
                var fieldInfo = {nameOfField: currentField.getName(), typeOfField: currentField.getType(), isFieldRequired: currentField.isRequired()},
                    template = "Field name is <%=nameOfField%> , Field type is <%=typeOfField%>, Field Required: <%=isFieldRequired%>";
                var populatedTemplate = _.template(template, fieldInfo);
                console.log(populatedTemplate);
                /*
                 Below, the fields of the form are rendered. A name, type, id, class and value are all assigned to
                 the fields. The name is entered as the value for demo purposes so fields can be distinguished. The
                 class can be used to refer to the fields in later functions. Once these are rendered they are added
                 to the 'fieldSection' of the page.

                 NOTE: This example renders all fields as input fields. A more complete soltion would need to check the 
                 field type and render different inputs (e.g. camera, signature capture etc).
                 */
                var input = document.createElement('input');
                input.setAttribute('name', currentField.getName());
                input.setAttribute('type', currentField.getType());
                input.setAttribute('id', currentField.getFieldId());
                input.setAttribute('class', 'formInput');
                input.setAttribute('value', currentField.getName());
                /*
                 The newly rendered fields are then added to the end of the forms section of the page via the appendChild
                 method.
                 */
                fieldSection.appendChild(input);
                fieldSection.appendChild(document.createElement('br'));

                /*
                 Displays the submit button. The submit button is only rendered if a valid formId has been entered.
                 The style.visibility attribute of the submit button is initially set to 'hidden' as there is no need
                 to load it if a valid formId isn't entered. Here the visibility is changed from 'hidden' to 'visible'.
                 Functions attached to the submit button can now be called.
                 */
                var submitButton = document.getElementById('submit');
                submitButton.style.visibility = "visible";
            }
        }
        

        /*
         Submissions can be triggered via the onClick function attached to the submit button.
         */
        document.getElementById('submit').onclick = function () {
            /*
            Create a new submission
            */
            currentSubmission = foundForm.newSubmission();
            /*
            The counter variable is used to keep track of how many field values have been passed into the .addInputValue()
            function. Each time a field value is passed in to this function, this counter increments.
             */
            var counter = 0;
            /*
            The numOfFields variable stores the number of fields that were rendered in the loadForm() function.
             */
            var numOfFields = document.getElementsByClassName('formInput').length;

            /*
             For each element that has the 'formInput' class (which is all the form fields rendered above), the background
             is rendered green initially. A validation check is done later, and any invalid fields
             are then rendered red. If the validation check does not fail on a field, no validation error has
             occurred and the field background will remain green.
             */
            _.forEach(document.getElementsByClassName('formInput'), function (elem) {
                elem.style.backgroundColor = "green";
            });

            /*
             When the fields of the form were rendered, they were assigned a class, 'formInput'. Here we iterate
             through every element with a class of 'formInput' and check if its a file or not.
             */
            _.forEach(document.getElementsByClassName('formInput'), function (elem) {
                /*
                 The 'valueToInput' variable is passed in to the .addInputValue() function below, however before it can
                 be passed in, we must determine if the value being passed in is being taken from a file or not, as values taken
                 from a file must be accessed differently to those of a standard text field.
                 */
                var valueToInput = null;
                /*
                 If the current element is a file, we get the first object at the first index (This will always
                 be the file itself) and add it to the 'valueToInput' variable. If it is not a file, then the value
                 of the element is added to the 'valueToInput' variable. This variable is then passed into the
                 .addInputValue() function.
                 */
                var currentSubmissionFieldId = elem.getAttribute("id");
                if (elem.files) {
                    valueToInput = elem.files.item(0);
                }
                else {
                    valueToInput = elem.value;
                }

                /*
                 SUBMISSIONS
                 */
                /*
                 The .addInputValue() function is called to add user data to a submission model. The data entered into the fields by
                 the user is taken and used for the submission.
                 params:
                    index: index of the field to put "value"
                    fieldId: ID of the field to add the value to
                    value: value to add
                 */
                if (valueToInput != null) {
                    currentSubmission.addInputValue({
                        index: 0,
                        fieldId: currentSubmissionFieldId,
                        value: valueToInput
                    }, function (err) {
                        /*
                         The callback function is executed when the value has been added or an error occurrs.
                         */
                        if(err){
                            console.log(err);
                        }
                        counter += 1;
                        
                    });

                }
                
                else {
                    /*
                     If no value is entered, dont add to submission.
                     */
                    counter += 1;
                }
            });

            /*
             Adding values is asynchronous. Check that all addInputValue functions have completed.
             */
            var interval = setInterval(function () {
                /*
                When the number stored in the counter variable is equal to the number of fields, all field values
                have been iterated through and passed to the .addInputValue function, and so the form is ready for submission.
                 */
                if (counter == numOfFields) {
                    clearInterval(interval);

                    /*
                     Event listener for 'submit'. This is called when the submission is valid, and when the submission is ready
                     for upload.
                     */
                    currentSubmission.on("submit", function () {
                        /*
                        Upload the submission.
                        */
                        currentSubmission.upload(function (err) {
                            if (err) {
                                console.log(err);
                            }
                        });
                    });

                    /*
                    Event listener for 'submitted'. Called when the submission has uploaded successfully.
                     */
                    currentSubmission.on("submitted", function () {
                      console.log(arguments);
                        window.alert("Form successfully submitted");
                        console.log("Form successfully submitted");
                        /*
                        Submission successfully completed. Creating a new empty submission.
                        */
                        currentSubmission = foundForm.newSubmission();

                    });

                    /*
                     Event listener for 'validationerror'. This is called if the submission is not valid. 
                     */
                    currentSubmission.on("validationerror", function (validationResult) {
                        console.log(validationResult);

                        for (var fieldId in validationResult) {

                            if (fieldId != 'valid') {
                                var fieldBackground = document.getElementById(fieldId);
                                console.log('Error with the field :', fieldId, validationResult[fieldId].fieldErrorMessage);
                                fieldBackground.style.backgroundColor = "red";
                            }
                        }
                    });

                    /*
                    Event listener for submission 'progress' event. Shows current progress of the submission upload.
                    */
                    currentSubmission.on('progress', function(progress){
                        console.log('Current submission progress',progress);
                        console.log('Total number of files to upload',progress.totalFiles);
                        console.log('Total size of the submission to upload',progress.totalSize);
                        console.log('Number of bytes uploaded',progress.uploaded);
                        console.log('Number of retry attempts',progress.retryAttempts);
                        console.log('Current file uploading',progress.currentFileIndex);
                        /*
                        progress.formJSON boolean. If the submission has been uploaded correctly.
                        */
                        console.log('form JSON uploaded',progress.formJSON);

                    });

                    /*
                    Event listener for 'error' event. An error occurred when uploading submission.
                    */
                    currentSubmission.on('error', function(error){
                        console.log('Error occurred when submitting', error);
                    });

                    /*
                     Submit current submission.
                     */
                    currentSubmission.submit(function (err) {
                        console.log(!err);
                        if (err) {
                            console.log(err);
                        }
                    });
                }
            }, 500)
        }
    });
};

/*
 $fh.ready must be called before making any on device API calls.
 */
$fh.ready({}, function () {
    /*
     $fh.init - Initialise the FeedHenry JS API, this must be called before calling any of the other SDK endpoints
     */
    $fh.init({}, function () {
        

        /*
        Uncomment these lines to use the mock mBaaS server included with the AppForm JS sdk
         */
        $fh.cloud_props.hosts.debugCloudUrl = "http://127.0.0.1:3001";
        $fh.app_props.host = "http://127.0.0.1:3001";

        /*
        Initializes the forms API
         */
        $fh.forms.init({}, function (err) {
            /*
             Calling $fh.forms.getForms() will return a list of forms from the server if the 'fromRemote' parameter is
              set to true. If the 'fromRemote' parameter is set to false, the forms will be listed from local memory.
             A list of forms are logged to the console. Inspecting these forms gives access to their ID's, which
             can be passed into the formId variable in the loadForm() function to load a different form.
             */
            $fh.forms.getForms({
                'fromRemote': true
            }, function (err, formsList) {
                if (err) {
                    console.log('Error loading forms', err);
                } else {
                    console.log('List of forms', formsList.getFormsList());
                    loadForm(formsList.getFormsList());
                }
                /*
                 Calls the loadForm function below once $fh.forms has been successfully initialized
                 */
                
            });

        });
        /*
         loadForm() is called once $fh.forms.getForms() has completed. The 'Street Service Form' is automatically loaded
         although any form can be loaded by passing a different id into the formId variable.'
         */
        function loadForm(formList) {
            // Display each form by name. Click on the name to call render form.
            var formListSection = document.getElementById('formListSection');

            for(var i=0; i<formList.length;i++) {
                var form = formList[i];

                var a = document.createElement('a');
                var linkText = document.createTextNode(form.name);
                a.appendChild(linkText);
                a.title = form.name;
                a.href = 'javascript:renderForms("' + form._id + '");';
                formListSection.appendChild(a);
                formListSection.appendChild(document.createElement('br'));
            }
        }


    });
});


