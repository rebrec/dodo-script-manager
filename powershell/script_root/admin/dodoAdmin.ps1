$scriptPath = split-path -parent $MyInvocation.MyCommand.Definition
$scriptPath = "\\sdis72.fr\Netlogon\Public\scripts\powershell"
Import-Module "$scriptPath\dodoLib.ps1"

$global:DODO_BASE_URL          = "http://$DODO_HOSTNAME" + ":" + "$DODO_PORT/api/script"
$global:DODO_SCRIPT_NAME       = "Scriptname-not-defined"
$global:DODO_SCRIPT_VERSION    = "Scriptversion-not-defined"

Function Get-DodoScripts {
    param()
    Try {
        $url = "$DODO_BASE_URL"
        Write-Host "Sending GET Request $url"
        $state = Invoke-RestMethod -Method Get -Uri $url
        if ($state.status -ne 'success'){ 
            throw "Error reaching url $url $(ConvertTo-JSON $state)"
            return @()
        }
        $res = $($state.data)
        return $res
    }
    Catch {
        return @()
    }
}

Function Get-DodoScriptVersions {
    [cmdletbinding()]
    Param (
        [parameter(ValueFromPipeline)]
        $scriptname
    )

    Try {
        $url = "$DODO_BASE_URL/$scriptname"
        Write-Host "Sending GET Request $url"
        $request = [System.Net.HttpWebRequest]::Create($url)
        $request.Method = "GET"
        #$request.ContentType = "application/json"
        $state = Invoke-RestMethod -Method Get -Uri $url
        if ($state.status -ne 'success'){ 
            throw "Error reaching url $url $(ConvertTo-JSON $state)"
            return @()
        }
        $res = $($state.data)
        return $res
    }
    Catch {
        return @()
    }
}


Function Get-DodoHosts {
    [cmdletbinding()]
    Param (
        $scriptname,
        $scriptversion
    )

    Try {
        $url = "$DODO_BASE_URL/$scriptname/$scriptversion"
        Write-Host "Sending GET Request $url"
        $request = [System.Net.HttpWebRequest]::Create($url)
        $request.Method = "GET"
        #$request.ContentType = "application/json"
        $state = Invoke-RestMethod -Method Get -Uri $url
        if ($state.status -ne 'success'){ 
            throw "Error reaching url $url $(ConvertTo-JSON $state)"
            return @()
        }
        $clients = $($state.data)
        $res = $clients  | % {
            $clientObj = $_
            $properties = $clientObj.additionnalData | Get-Member -MemberType NoteProperty | Select -ExpandProperty Name
            foreach ($property in $properties){
                $value = ($clientObj.additionnalData | Select -ExpandProperty $property)
                Add-Member -InputObject $clientObj -MemberType NoteProperty -Name $property -Value $value
            }
            $clientObj
        }

        return $res
    }
    Catch {
        return @()
    }
}

Function Add-DodoTester {
    [cmdletbinding()]
    Param (
        $scriptname,
        $scriptversion,
        $uid
    )

    Try {
        $url = "$DODO_BASE_URL/settings/$scriptname/$scriptversion/$uid"
        Write-Host "Sending PUT Request $url"

        $data = ConvertTo-Json @()

        $state = Invoke-RestMethod -Method Put -Uri $url -ContentType 'application/json' -Body $data
    
        if ($state.status -ne 'success'){ 
            throw "Error reaching url $url $(ConvertTo-JSON $state)"
        }
        $res = $state

        return $res
    }
    Catch {
        return $false
    }
}


Function Remove-DodoTester {
    [cmdletbinding()]
    Param (
        $scriptname,
        $scriptversion,
        $uid
    )

    Try {
        $url = "$DODO_BASE_URL/settings/$scriptname/$scriptversion/$uid"
        Write-Host "Sending DELETE Request $url"

        $data = ConvertTo-Json @()

        $state = Invoke-RestMethod -Method Delete -Uri $url -ContentType 'application/json' -Body $data
    
        if ($state.status -ne 'success'){ 
            throw "Error reaching url $url $(ConvertTo-JSON $state)"
        }
        $res = $state

        return $res
    }
    Catch {
        return $false
    }
}


Function Remove-DodoHost {
    [cmdletbinding()]
    Param (
        $scriptname,
        $scriptversion,
        $uid
    )

    Try {
        $url = "$DODO_BASE_URL/$scriptname/$scriptversion/$uid"
        Write-Host "Sending DELETE Request $url"

        $data = ConvertTo-Json @()

        $state = Invoke-RestMethod -Method Delete -Uri $url -ContentType 'application/json' -Body $data
    
        if ($state.status -ne 'success'){ 
            throw "Error reaching url $url $(ConvertTo-JSON $state)"
        }
        $res = $state

        return $res
    }
    Catch {
        return $false
    }
}


Function Remove-DodoScriptname {
    [cmdletbinding()]
    Param (
        $scriptname
    )
    Get-DodoScriptVersions -scriptname $scriptname | % { 
        Remove-DodoScriptVersion -scriptname $scriptname -scriptversion $_ 
    }
}

Function Remove-DodoScriptVersion {
    [cmdletbinding()]
    Param (
        $scriptname,
        $scriptversion
    )
    Write-Host "Removing Scriptname : $scriptname, version $scriptversion"
    Get-DodoHosts -scriptname $scriptname -scriptversion $scriptversion | % { Remove-DodoHost -scriptname $scriptname -scriptversion $scriptversion -uid $_.hostname }
}


Function Get-DodoScriptSettings {
    [cmdletbinding()]
    Param (
        $scriptname,
        $scriptversion
    )

    Try {
        $url = "$DODO_BASE_URL/settings/$scriptname/$scriptversion"
        Write-Host "Sending GET Request $url"
        $state = Invoke-RestMethod -Method Get -Uri $url
        if ($state.status -ne 'success'){ 
            throw "Error reaching url $url $(ConvertTo-JSON $state)"
            return @()
        }
        $res = $state.data

        return $res
    }
    Catch {
        return @()
    }
}


Function Get-DodoTesters {
    [cmdletbinding()]
    Param (
        $scriptname,
        $scriptversion
    )

    Try {
        $scriptsettings = Get-DodoScriptSettings -scriptname $scriptname -scriptversion $scriptversion
        return $scriptsettings.testers
    }
    Catch {
        return @()
    }
}


Write-Host "Example command : "
Write-host 'Get-DodoScript -scriptname "Migration-citrix-receiver" -scriptversion "0.1" | Where {$_.executed -eq $true}'
