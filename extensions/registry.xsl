<?xml version="1.0"?>

<xsl:stylesheet version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:import href="rev_utils.xsl"/>

<xsl:output method="html"/>

<xsl:variable name="registry" select="document('registry.xml')/registry" />

<xsl:template match="*|node()">
  <xsl:copy>
    <xsl:copy-of select="@*" />
    <xsl:apply-templates select="node()" />
  </xsl:copy>
</xsl:template>

<xsl:template match="extension|draft">
  <li value="{number}">
    <a href="{@href}"><xsl:value-of select="name" /></a>
  </li>
</xsl:template>

<xsl:template match="ol[@id='official-by-number']">
  <xsl:copy>
    <xsl:apply-templates select="$registry/extension">
      <xsl:sort select="number" data-type="number" order="ascending" />
    </xsl:apply-templates>
  </xsl:copy>
</xsl:template>

<xsl:template match="ol[@id='official-by-name']">
  <xsl:copy>
    <xsl:apply-templates select="$registry/extension">
      <xsl:sort select="name"/>
    </xsl:apply-templates>
  </xsl:copy>
</xsl:template>

<xsl:template match="ol[@id='draft-by-number']">
  <xsl:copy>
    <xsl:apply-templates select="$registry/draft">
      <xsl:sort select="number" data-type="number" order="ascending" />
    </xsl:apply-templates>
  </xsl:copy>
</xsl:template>

<xsl:template match="ol[@id='draft-by-name']">
  <xsl:copy>
    <xsl:apply-templates select="$registry/draft">
      <xsl:sort select="name"/>
    </xsl:apply-templates>
  </xsl:copy>
</xsl:template>

<xsl:template match="ol[@id='recent-revisions']">
  <xsl:copy>
    <xsl:for-each select="$registry/*/history/revision">
      <xsl:sort select="@date" order="descending"/>
      <xsl:if test="position() &lt; 11">
        <li>
          <a href="{../../@href}"><xsl:value-of select="../../name" /></a>
          <xsl:text> : revision </xsl:text>
          <xsl:value-of select="@number"/>
          <xsl:text> on </xsl:text>
          <time>
            <xsl:call-template name="month_of_date">
              <xsl:with-param name="date" select="@date"/>
            </xsl:call-template><xsl:text> </xsl:text>
            <xsl:value-of select="substring(@date,9,2)"/>
            <xsl:text>, </xsl:text>
            <xsl:value-of select="substring(@date,1,4)"/>
          </time>
          <ul>
            <xsl:for-each select="change">
              <li><xsl:copy-of select="node()"/></li>
            </xsl:for-each>
          </ul>
        </li>        
      </xsl:if>
    </xsl:for-each>
  </xsl:copy>
</xsl:template>
  
</xsl:stylesheet>
