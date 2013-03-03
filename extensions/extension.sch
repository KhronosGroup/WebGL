<?xml version="1.0" encoding="UTF-8" ?>
<schema xmlns="http://purl.oclc.org/dsdl/schematron">
  <title>WebGL Extension Validity Schematron Schema</title>
  <!--<ns prefix="" uri="" />-->

  <!-- All Extension documents (proposals, drafts, extensions, and ratifieds) -->
  <pattern name="Extension" id="extension-patt">
    <rule context="/proposal">
      <assert test="@href[starts-with('proposals/')]"
              >A proposal belongs in the 'proposals' directory.</assert>
      <assert test="self::node()[@href=concat('proposals/',name,'/')]"
              >A proposal should have a URL matching its name.</assert>
    </rule>

    <rule context="/ratified | /extension | /draft">
      <assert test="self::node()[@href=concat(name,'/')]"
              >An extension should have a URL matching its name.</assert>
    </rule>

    <rule context="/*">
      <assert test="self::node()[@href=concat($path,'/')]"
              >An extension should be stored under its name.</assert>
    </rule>
  </pattern>
</schema>