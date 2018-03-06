$global:DODO_SCRIPT_NAME       = "SOME_SCRIPT_NAME"
$global:DODO_SCRIPT_VERSION    = "SOME_VERSION"

###################################################################################################
## If needed, you can override the global:Get-UniqueExecutionId  cmdlet to change the unique Identifier
## associated with every computer
## this identifier will be persisted server side
## by default, the identifier is the computer HOSTNAME
## which mean that scripts will only be executed once per computer
## If for instance you want to run a script on a per machine and per user
## you can create a uniqueid based on both the hostname and the username as below
## Function global:Get-UniqueExecutionId {  
##     return "$env:COMPUTERNAME-$env:USERNAME"
## }
###################################################################################################

###################################################################################################
## If needed, you can also define prerequisite conditions that need to be met
## before any execution of the script occurs. This is done buy overriding the function below  
## Function global:isDodoExecutionContextCorrect {
##     if ((get-date).DayOfWeek -eq "Tuesday"){
##         return $true # return $true to allow execution
##     } else {
##         return $false # return $false to forbid execution
##     }
## }
###################################################################################################
Function Main{
    # Your code goes here
	
	# DON'T FORGET TO CHANGE BELOW !
	if ($someCheck -eq $true) {
		return $true # persist on Dodo Server Success of the script execution
	} else {
		return $false # persist on Dodo Server the failure of the script execution
	}
    
}
