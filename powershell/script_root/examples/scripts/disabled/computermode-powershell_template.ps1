$global:DODO_SCRIPT_NAME       = "Some_Scriptname"
$global:DODO_SCRIPT_VERSION    = "1.0"

# If needed, uncomment this function to be able to track script execution
# According to something different than just the computername
# (ie : host-user, or host-user-some_uniq_id_per_installation, ...)
# The default behaviour is to be based on $env:COMPUTERNAME
#
# Function global:Get-UniqueExecutionId {  
#     return "$env:COMPUTERNAME-$env:USERNAME"
# }
#
# If needed add specific conditions before allowing execution (timerange, specific date, etc)
# Function global:isDodoExecutionContextCorrect {
#     return $true # return $true to allow execution, else return $false
# }

# The Main Function is called only if thoses 2 conditions are met:
# - Dodo Server allow execution of the script for the specific UniqueExecutionId
#   returned by global:Get-UniqueExecutionId
# - The call to global:isDodoExecutionContextCorrect return $true
Function Main{
	logDodo "Here is a message that will be printed both to standard output and"
	logDodo "uploaded to Dodo Server at the end of the execution of the Main function"
	logDodo "This way the Dodo Server Administrator will be able to retrieve"
	logDodo "usefull information about the script execution (either the execution is"
	logDodo "successfull or not."
	$someCheck = $true
    # We save the execution status so that we do not execute it twice
	If ($someCheck -eq $true){
		return $true  # Execution is correct (Dodo Server will mark this script as being
                  # executed successfully so it won't execute again
	} else {
		return $false # Execution is NOT correct (Dodo Server will mark this script as being
                  # executed successfully so it will execute again next time
                  # Dodo Launcher is called
	}
}
